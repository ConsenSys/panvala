import * as ethers from 'ethers';
import * as readline from 'readline';
import { getProposalsForRequests } from '../src/utils/requests';
import { sequelize } from '../src/models';
import { bigNumberify } from 'ethers/utils';

const { voting } = require('../src/utils');
const { ContestStatus } = voting;
const { getContracts } = require('../src/utils/eth');
const mnemonic = process.env.MNEMONIC;

const gasPrice = ethers.utils.hexlify(2e9);
sequelize.options.logging = false;

const categoryName = {
  '0': 'GRANT',
  '1': 'GOVERNANCE',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printFunctionSupport(intended = 'finalizeContest', alternative = 'countVotes') {
  console.log(
    `Gatekeeper ABI does not support method: ${intended} method. running ${alternative} instead.`
  );
}

async function firstRoundVote(epochNumber, resource, gkFuncs) {
  if (gkFuncs.hasOwnProperty('finalizeContest')) {
    const tx = await gkFuncs.finalizeContest(epochNumber, resource);
    console.log(tx.hash);
  } else {
    printFunctionSupport();
    await gkFuncs.countVotes(epochNumber, resource);
  }
}

async function finalize(gatekeeper, epochNumber, resource, index) {
  console.log(`Processing category ${categoryName[index]}`);

  const gkFuncs = gatekeeper.functions;
  const status = (await gkFuncs.contestStatus(epochNumber, resource)).toString();
  console.log('status', status);

  if (status === ContestStatus.Empty) {
    console.log(`No slates found for resource ${resource}, skipping`);
  }

  // single slate
  if (status === ContestStatus.NoContest) {
    console.log(`No challenger for resource ${resource} -- automatically finalizing`);
    await firstRoundVote(epochNumber, resource, gkFuncs);
  }

  // active contest
  if (status === ContestStatus.Active) {
    console.log('Counting votes for epochNumber, resource, status', epochNumber, resource, status);
    await firstRoundVote(epochNumber, resource, gkFuncs);
  }

  // contest already finalized
  if (status === ContestStatus.Finalized) {
    console.log('Contest was already finalized', epochNumber.toString(), resource);
  } else {
    const newStatus = await gkFuncs.contestStatus(epochNumber, resource);
    console.log('new status', newStatus);
  }
}

async function disburseGrants(
  wallet: ethers.ethers.Wallet,
  provider,
  gatekeeper,
  capacitor,
  epochNumber
) {
  const resource = capacitor.address;
  const status = (await gatekeeper.contestStatus(epochNumber, resource)).toString();
  console.log('status', status);

  if (status !== ContestStatus.Finalized) {
    console.log('Contest for token capacitor has not been finalized.');
  }

  // get requests corresponding to the winning slate
  const winner = await gatekeeper.getWinningSlate(epochNumber, resource);
  console.log('Winning slate: ', winner.toString());

  // get requests
  const requestIDs = (await gatekeeper.slateRequests(winner)).map(r => r.toString());
  console.log('REQUESTS', requestIDs);

  const proposalIDs = await getProposalsForRequests(resource, requestIDs).then(proposals =>
    proposals.map(p => p.proposalID)
  );
  console.log('PROPOSALS', proposalIDs);

  // Get the unexecuted proposals
  const allProposals: any[] = await Promise.all(
    proposalIDs.map(async id => {
      const proposal = await capacitor.proposals(id);
      return { ...proposal, proposalID: id };
    })
  );
  // console.log('all', allProposals);
  const unexecutedProposals: any[] = allProposals.filter(
    (p: { withdrawn: boolean }) => !p.withdrawn
  );
  // console.log(unexecutedProposals);
  console.log(`${unexecutedProposals.length} grants to withdraw`);

  // functions that each take a nonce
  const tasks = unexecutedProposals.map(proposal => {
    const { tokens, to } = proposal;

    return async nonce => {
      console.log(`> Withdrawing ${tokens.toString()} tokens for ${to}`);
      const tx = await capacitor.withdrawTokens(proposal.proposalID, { gasPrice, nonce });

      console.log(tx.hash);
      await tx.wait();
    };
  });

  await sequenceNonces(provider, wallet, tasks);
}

// TODO: move to panvala-utils
// Execute a set of functions in sequence passing the sequential nonces
async function sequenceNonces(provider, wallet: ethers.Wallet, asyncFuncs) {
  // https://github.com/ethers-io/ethers.js/issues/435#issuecomment-467284296
  let baseNonce = provider.getTransactionCount(wallet.getAddress());
  let nonceOffset = 0;
  function getNonce() {
    return baseNonce.then(nonce => nonce + nonceOffset++);
  }

  for (let fn of asyncFuncs) {
    const nonce = await getNonce();

    await fn(nonce);
  }
}

async function getWinningSlate(gatekeeper, epochNumber, resource) {
  const status = (await gatekeeper.contestStatus(epochNumber, resource)).toString();
  if (status !== ContestStatus.Finalized) {
    console.log('Contest has not been finalized.');
    return null;
  }

  // Enrich slate with slateID field
  const winningSlate = await gatekeeper.getWinningSlate(epochNumber, resource).then(slateID =>
    gatekeeper.slates(slateID).then(slate => {
      return { ...slate, slateID };
    })
  );
  // console.log('Winning slate: ', winningSlate);
  return winningSlate;
}

async function askUser(question: string, handleAnswer) {
  return new Promise(resolve => {
    console.log();
    rl.question(question, async _answer => {
      // Do it
      await handleAnswer(_answer);

      resolve();
    });
  });
}

async function run() {
  const {
    provider,
    gatekeeper: ROGatekeeper,
    tokenCapacitor,
    parameterStore,
  } = await getContracts();
  const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const wallet = new ethers.Wallet(mnemonicWallet.privateKey, provider);
  const gatekeeper = ROGatekeeper.connect(wallet);

  // NOTE: make sure you are running this script during +1 epoch of the one you are finalizing
  const epochNumber = (await gatekeeper.functions.currentEpochNumber()).sub(1);
  console.log('epochNumber:', epochNumber.toString());
  console.log();
  const resources = [tokenCapacitor.address, parameterStore.address];

  // Finalize contests
  try {
    console.log('> Finalizing ballots for all categories...');
    const finalizeAllCategories = resources.map((resource, index) =>
      finalize(gatekeeper, epochNumber, resource, index)
    );
    await Promise.all(finalizeAllCategories);
    console.log('DONE');
  } catch (error) {
    console.error(error);
  }

  // Get winning slates for each resource (null if not finalized)
  const winningSlates = await Promise.all(
    resources.map(resource => getWinningSlate(gatekeeper, epochNumber, resource))
  );

  const writeTokenCapacitor = tokenCapacitor.connect(wallet);

  // Execute proposals
  await askUser('Do you want to execute proposals? [y/N]', async answer => {
    if (answer === 'y') {
      console.log('> Disbursing grants');
      await disburseGrants(wallet, provider, gatekeeper, writeTokenCapacitor, epochNumber).catch(
        error => {
          console.log('Problem disbursing grants', error);
        }
      );

      // TODO: handle governance slate
    } else {
      console.log('> Not executing proposals');
    }
  }).catch(error => {
    console.log(error);
  });

  const [grantWinner] = winningSlates;

  if (grantWinner != null) {
    console.log();
    // console.log('GRANT', grantWinner);
    const { slateID, stake, staker, resource } = grantWinner;

    if (stake.gt(bigNumberify(0))) {
      console.log(`Slate ${slateID} has a stake of ${stake.toString()}`);

      if (wallet.address === staker) {
        console.log('You are the original staker!');
        await askUser('Do you want to withdraw this stake? [y/N]', async answer => {
          if (answer === 'y') {
            console.log(`> Withdrawing stake for slate ${slateID}`);
            const tx = await gatekeeper.withdrawStake(slateID);
            console.log(tx.hash);
            await tx.wait();
          } else {
            console.log(`> Not withdrawing stake for slate ${slateID}`);
          }
        }).catch(error => {
          console.log('Problem withdrawing stake');
          console.log(error);
        });
      } else {
        // console.log('You are not the original staker');
      }
    } else {
      console.log('No stake left');
    }

    const { stakedSlates } = await gatekeeper.contestDetails(epochNumber, resource);
    // Donate challenger stakes if there are any
    if (stakedSlates.length > 1) {
      console.log(`There are challenger slates`);
      await askUser('Do you want to donate challenger stakes? [y/N]', async answer => {
        if (answer == 'y') {
          console.log('> Donating challenger stakes');
          const tx = await gatekeeper.donateChallengerStakes(
            epochNumber,
            resource,
            0,
            stakedSlates.length
          );
          console.log(tx.hash);
          await tx.wait();
        } else {
          console.log('> Not donating challenger stakes');
        }
      });
    }
  }

  rl.close();
  process.exit(0);
}

run();
