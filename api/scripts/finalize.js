const ethers = require('ethers');
const { voting } = require('../utils');
const { ContestStatus } = voting;
const { getContracts } = require('../utils/eth');
const mnemonic = process.env.MNEMONIC;

const categoryName = {
  '0': 'GRANT',
  '1': 'GOVERNANCE',
};

function printFunctionSupport(intended = 'finalizeContest', alternative = 'countVotes') {
  console.log(
    `Gatekeeper ABI does not support method: ${intended} method. running ${alternative} instead.`
  );
}

async function firstRoundVote(epochNumber, resource, gkFuncs) {
  if (gkFuncs.hasOwnProperty('finalizeContest')) {
    await gkFuncs.finalizeContest(epochNumber, resource);
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

  // single slate
  if (status === ContestStatus.NoContest) {
    console.log(`No challenger for resource ${resource} -- automatically finalizing`);
    firstRoundVote(epochNumber, resource, gkFuncs);
  }

  // active contest
  if (status === ContestStatus.Active) {
    console.log('Counting votes for epochNumber, resource, status', epochNumber, resource, status);
    firstRoundVote(epochNumber, resource, gkFuncs);
  }

  // contest already finalized
  if (status === ContestStatus.Finalized) {
    console.log('Contest was already finalized', epochNumber, resource);
  } else {
    const newStatus = await gkFuncs.contestStatus(epochNumber, resource);
    console.log('new status', newStatus);
  }
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
  console.log('epochNumber:', epochNumber);
  const resources = [tokenCapacitor.address, parameterStore.address];

  try {
    console.log('Finalizing ballots for all categories...');
    const finalizeAllCategories = resources.map((resource, index) =>
      finalize(gatekeeper, epochNumber, resource, index)
    );
    await Promise.all(finalizeAllCategories);
    console.log('DONE');
  } catch (error) {
    console.error(error);
  }
}

run();
