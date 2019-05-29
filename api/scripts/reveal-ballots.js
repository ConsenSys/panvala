const { voting } = require('../../packages/panvala-utils');
const ethers = require('ethers');

const { SubmittedBallot, VoteChoice } = require('../models');
const { getContracts } = require('../utils/eth');

const mnemonic = process.env.MNEMONIC;

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
  const categories = [];
  const firstChoices = [];
  const secondChoices = [];

  choices.forEach(choice => {
    const cat = 0; // NOTE: THIS IS A HACK. ONLY SUPPORTS 1 CATEGORY (GRANT PROPOSALS)
    categories.push(cat.toString());
    firstChoices.push(choice.firstChoice);
    secondChoices.push(choice.secondChoice);
  });

  const encodedBallot = voting.encodeBallot(categories, firstChoices, secondChoices);

  return encodedBallot;
}

async function run() {
  const { gatekeeper: ROGatekeeper } = getContracts();
  const provider = ROGatekeeper.provider;
  const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const wallet = new ethers.Wallet(mnemonicWallet.privateKey, provider);

  // get the contract interface for the Gatekeeper
  const gatekeeper = ROGatekeeper.connect(wallet);
  console.log('gatekeeper', gatekeeper.address);

  // read ballots from the database
  const batchNumber = '0';
  const ballots = await getBallots(batchNumber);

  if (ballots.length === 0) {
    console.log(`No ballots for batch ${batchNumber}`);
    process.exit();
  }

  // Filter out the ones that have already been revealed
  const p = ballots.map(b => {
    const _ballot = b.get({ plain: true });
    return gatekeeper.functions.didReveal(batchNumber, _ballot.voterAddress).then(didReveal => {
      // console.log(didReveal, _ballot);
      return { ..._ballot, didReveal };
    });
  });

  const enriched = await Promise.all(p);
  // console.log('ENRICHED', enriched);

  const toReveal = enriched.filter(e => e.didReveal === false);
  // console.log('TO REVEAL', toReveal);

  if (toReveal.length === 0) {
    console.log(`All ballots already revealed for batch ${batchNumber}`);
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
  console.log(encodedBallots);
  console.log('salts:', salts);

  try {
    console.log(`Revealing ${voters.length} ballot(s)...`);

    try {
      const tx = await gatekeeper.functions.revealManyBallots(
        batchNumber,
        voters,
        encodedBallots,
        salts
      );
      console.log(tx);

      console.log('DONE');
      process.exit(0);
    } catch (error) {
      console.error('Error', error);
      // const a = JSON.parse(error.responseText);
      // console.log(a);
      // console.error(a.error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
