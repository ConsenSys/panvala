const { voting } = require('../../packages/panvala-utils');
const ethers = require('ethers');
const sortBy = require('lodash/sortBy');
const { SubmittedBallot, VoteChoice } = require('../models');
const { getContracts } = require('../utils/eth');

const mnemonic = process.env.MNEMONIC;

/**
 * @param {string} epochNumber
 */
async function getBallots(epochNumber) {
  const data = await SubmittedBallot.findAll({
    where: {
      epochNumber,
    },
    include: [VoteChoice],
  });
  return data;
}

function encode(choices) {
  const resources = [];
  const firstChoices = [];
  const secondChoices = [];

  const sorted = sortBy(choices, 'resource');
  sorted.forEach(choice => {
    resources.push(choice.resource);
    firstChoices.push(choice.firstChoice);
    secondChoices.push(choice.secondChoice);
  });

  return voting.encodeBallot(resources, firstChoices, secondChoices);
}

async function revealSingle(gatekeeper, ballot) {
  const { voterAddress, salt, VoteChoices, epochNumber } = ballot;
  try {
    const tx = await gatekeeper.functions.revealBallot(
      epochNumber,
      voterAddress,
      VoteChoices.map(choice => choice.resource),
      VoteChoices.map(choice => choice.firstChoice),
      VoteChoices.map(choice => choice.secondChoice),
      salt,
    );
    console.log(tx);
    const receipt = await tx.wait();
    console.log(receipt);
  } catch (error) {
    console.error(error);
  }
}

function parseArgs() {
  // node reveal-ballots.js
  if (process.argv.length !== 2) {
    console.log('Usage: reveal-ballots.js');
    process.exit(0);
  }
}

async function run() {
  parseArgs();

  const { provider, gatekeeper: ROGatekeeper } = getContracts();
  const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const wallet = new ethers.Wallet(mnemonicWallet.privateKey, provider);
  const gatekeeper = ROGatekeeper.connect(wallet);
  console.log('gatekeeper:', gatekeeper.address);

  // Reveal for the current epoch
  const epochNumber = (await gatekeeper.functions.currentEpochNumber()).toString();
  console.log('Revealing for epoch:', epochNumber);

  // read ballots from the database
  const ballots = await getBallots(epochNumber);
  console.log(`Found ${ballots.length} ballot(s)`);
  // console.log('ballots:', ballots);

  if (ballots.length === 0) {
    console.log(`No ballots for batch ${epochNumber}`);
    process.exit(0);
  }

  // Filter out the ones that have already been revealed
  const ballotPromises = ballots.map(async b => {
    const _ballot = b.get({ plain: true });
    const didCommit = await gatekeeper.functions.didCommit(epochNumber, _ballot.voterAddress);
    return gatekeeper.functions.didReveal(epochNumber, _ballot.voterAddress).then(didReveal => {
      // console.log(didReveal, _ballot);
      return { ..._ballot, didReveal, didCommit };
    });
  });

  const enriched = await Promise.all(ballotPromises);
  console.log('ENRICHED', enriched);

  // const notCommitted = enriched.filter(e => e.didCommit === false);
  const toReveal = enriched.filter(e => e.didReveal === false).filter(e => e.didCommit);
  console.log('TO REVEAL', toReveal);

  if (toReveal.length === 0) {
    console.log(`All ballots already revealed for batch ${epochNumber}`);
    // if (notCommitted.length > 0) {
    //   console.warn(`Some ballots have not been committed: ${JSON.stringify(notCommitted)}`);
    // }
    process.exit(0);
  }

  // console.log(gatekeeper.functions);

  // encode the ballots
  const voters = [];
  const encodedBallots = [];
  const salts = [];

  // Prepare data
  console.log(`Preparing data for ${toReveal.length} ballot(s) ...`);

  // Backup if the batched tx is failing: reveal a single ballot and exit
  // await revealSingle(gatekeeper, toReveal[0]);
  // process.exit(0);

  toReveal.forEach(ballot => {
    const data = ballot;
    console.log('did reveal? ', data.didReveal);
    voters.push(data.voterAddress);

    const encodedBallot = encode(data.VoteChoices);
    encodedBallots.push(encodedBallot);

    salts.push(data.salt);
  });

  // Reveal
  console.log('voters:', voters);
  console.log('encodedBallots:', encodedBallots);
  console.log('salts:', salts);

  try {
    console.log(`Revealing ${voters.length} ballot(s)...`);

    try {
      const tx = await gatekeeper.functions.revealManyBallots(
        epochNumber,
        voters,
        encodedBallots,
        salts
      );
      console.log(tx);
      const receipt = await tx.wait();
      console.log(receipt);

      console.log('DONE');
      process.exit(0);
    } catch (error) {
      console.error('Error', error);
      const a = JSON.parse(error.responseText);
      // console.log(a);

      console.log('');
      console.log(`Problem revealing ballots -- ${a.error.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
