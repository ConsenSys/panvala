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
  console.log('ballots:', ballots);

  if (ballots.length === 0) {
    console.log(`No ballots for batch ${epochNumber}`);
    process.exit(0);
  }

  // Filter out the ones that have already been revealed
  const ballotPromises = ballots.map(b => {
    const _ballot = b.get({ plain: true });
    return gatekeeper.functions.didReveal(epochNumber, _ballot.voterAddress).then(didReveal => {
      // console.log(didReveal, _ballot);
      return { ..._ballot, didReveal };
    });
  });

  const enriched = await Promise.all(ballotPromises);
  console.log('ENRICHED', enriched);

  const toReveal = enriched.filter(e => e.didReveal === false);
  console.log('TO REVEAL', toReveal);

  if (toReveal.length === 0) {
    console.log(`All ballots already revealed for batch ${epochNumber}`);
    process.exit(0);
  }

  // console.log(gatekeeper.functions);

  // encode the ballots
  const voters = [];
  const encodedBallots = [];
  const salts = [];

  // Prepare data
  console.log(`Preparing data for ${toReveal.length} ballot(s) ...`);
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
