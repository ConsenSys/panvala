/* globals artifacts assert */
const ethUtils = require('ethereumjs-util');
const bs58 = require('bs58');
const ethers = require('ethers');


const Gatekeeper = artifacts.require('Gatekeeper');
const BasicToken = artifacts.require('BasicToken');
const ParameterStore = artifacts.require('ParameterStore');
const TokenCapacitor = artifacts.require('TokenCapacitor');

const { solidityKeccak256, defaultAbiCoder: abiCoder } = ethers.utils;

const {
  BN,
  abiEncode,
  asBytes,
  stripHexPrefix,
  bytesAsString,
  zeroHash,
  sha256,
} = require('../utils');

/**
 * Check that the error is an EVM `revert`
 * @param {Error} error The error to check
 */
function expectRevert(error) {
  assert(
    error.toString().includes('VM Exception while processing transaction: revert'),
    `Expected revert -- ${error}`,
  );
}

/**
 * Assert that the receipt contains the expected events
 * @param {TransactionReceipt} receipt
 * @param {Array} eventNames
 */
function expectEvents(receipt, eventNames) {
  // const actualEventNames = receipt.logs.map(l => l.event);
  assert.deepStrictEqual(
    receipt.logs.map(l => l.event),
    eventNames,
    `Incorrect events emitted -- expected ${eventNames}`,
  );
}

/**
 * Assert that the error message contains the expected substring
 * @param {String} error
 * @param {String} substring
 */
function expectErrorLike(error, substring) {
  const msg = `Expected error "${error.message}" to include "${substring}"`;
  assert(error.toString().includes(substring), msg);
}


function createMultihash(data) {
  const digest = sha256(data);

  const hashFunction = Buffer.from('12', 'hex'); // 0x20
  const digestSize = Buffer.from(digest.byteLength.toString(16), 'hex');
  const combined = Buffer.concat([hashFunction, digestSize, digest]);
  const multihash = bs58.encode(combined);

  // console.log(multihash.toString()); // QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4

  return multihash.toString();
}

function calculateSupply(initialTokens, decimals) {
  // calculate the initial supply:
  const tokens = new BN(initialTokens);
  const ten = new BN(10);
  const exponent = new BN(decimals);

  // const factor = ten.pow(exponent);
  const initialSupply = tokens.mul(ten.pow(exponent));
  return initialSupply;
}

/**
 * Convenience function for creating a token
 * @param {Object} params : { decimals, initialTokens, ...txParams }
 */
async function newToken(params) {
  const tokenParams = params || {};
  const decimals = tokenParams.decimals || '18';
  const initialTokens = tokenParams.initialTokens || 100000;

  const supply = calculateSupply(initialTokens, decimals);
  return BasicToken.new('Testcoin', 'TEST', decimals.toString(), supply, {
    from: params.from,
  });
}

/**
 * Convenience function for creating a Gatekeeper
 * Deploys a Token and a ParameterStore they aren't passed in.
 * @param {*} options from, parameterStoreAddress, tokenAddress, init
 */
async function newGatekeeper(options) {
  const { from: creator, parameterStoreAddress, init = true } = options;
  let { tokenAddress } = options;
  let parameters;

  // Deploy a token if the address of one isn't passed in
  if (typeof tokenAddress === 'undefined') {
    // console.log('deploying token');
    const token = await newToken({ from: creator });
    tokenAddress = token.address;
  }
  // console.log(`token deployed at ${tokenAddress}`);
  assert(typeof tokenAddress !== 'undefined', 'Token is undefined');

  // deploy a ParameterStore if the address of one isn't passed in
  if (typeof parameterStoreAddress === 'undefined') {
    const stakeAmount = '5000';
    parameters = await ParameterStore.new(
      ['slateStakeAmount', 'tokenAddress'],
      [
        abiCoder.encode(['uint256'], [stakeAmount]),
        abiCoder.encode(['address'], [tokenAddress]),
      ],
      { from: creator },
    );
  } else {
    parameters = await ParameterStore.at(parameterStoreAddress);
  }

  // console.log('using token at address', tokenAddress);
  // set token
  await parameters.setInitialValue(
    'tokenAddress',
    abiCoder.encode(['address'], [tokenAddress]),
    { from: creator },
  );

  // deploy a Gatekeeeper
  const startTime = '6000';
  const gatekeeper = await Gatekeeper.new(startTime, parameters.address, { from: creator });
  await parameters.setInitialValue(
    'gatekeeperAddress',
    abiCoder.encode(['address'], [gatekeeper.address]),
    { from: creator },
  );

  // initialize
  if (init) {
    await parameters.init({ from: creator });
  }

  // console.log('tokenAddress', await parameters.getAsAddress('tokenAddress'));
  // console.log('gatekeeperAddress', await parameters.getAsAddress('gatekeeperAddress'));

  return gatekeeper;
}


/**
 * Set up the Panvala contracts
 * @param {*} options from, parameterStoreAddress, tokenAddress
 */
async function newPanvala(options) {
  const { from: creator } = options;

  const gatekeeper = await newGatekeeper({ ...options, init: false });
  const parametersAddress = await gatekeeper.parameters();
  const parameters = await ParameterStore.at(parametersAddress);
  const tokenAddress = await parameters.getAsAddress('tokenAddress');
  const token = await BasicToken.at(tokenAddress);
  const capacitor = await TokenCapacitor.new(parameters.address, { from: creator });

  await parameters.setInitialValue(
    'tokenCapacitorAddress',
    abiCoder.encode(['address'], [capacitor.address]),
    { from: creator },
  );
  // console.log(`ParameterStore: ${parameters.address}`);
  // console.log(`Gatekeeper: ${gatekeeper.address}`);
  // console.log(`TokenCapacitor: ${capacitor.address}`);
  // console.log(`Token: ${token.address}`);

  return {
    gatekeeper, parameters, capacitor, token,
  };
}


/**
 * generateCommitHash
 * keccak256(category + firstChoice + secondChoice ... + salt)
 * @param {*} votes { category: { firstChoice, secondChoice }}
 * @param {ethUtils.BN} salt Random 256-bit number
 */
function generateCommitHash(votes, salt) {
  const types = [];
  const values = [];

  Object.keys(votes).forEach((category) => {
    const { firstChoice, secondChoice } = votes[category];
    types.push('uint', 'uint', 'uint');
    values.push(category, firstChoice, secondChoice);
  });
  types.push('uint');
  values.push(salt);

  // const packed = ethers.utils.solidityPack(types, values);
  // console.log(packed);
  return solidityKeccak256(types, values);
}

const proposalCategories = {
  GRANT: 0,
  GOVERNANCE: 1,
};

/**
 * Create a grant proposal slate from proposal info
 * options include: gatekeeper, capacitor, proposals, recommender, metadata, batchNumber
 * @param {*} options
 */
async function grantSlateFromProposals(options) {
  const {
    gatekeeper, capacitor, proposals, recommender, metadata, batchNumber,
  } = options;
  const beneficiaries = [];
  const tokenAmounts = [];
  const metadataHashes = [];
  proposals.forEach((p) => {
    beneficiaries.push(p.to);
    tokenAmounts.push(p.tokens);
    metadataHashes.push(asBytes(p.metadataHash));
  });

  const receipt = await capacitor.createManyProposals(
    beneficiaries,
    tokenAmounts,
    metadataHashes,
    { from: recommender },
  );

  const requestIDs = receipt.logs.map(l => l.args.requestID);

  await gatekeeper.recommendSlate(
    batchNumber,
    proposalCategories.GRANT,
    requestIDs,
    asBytes(metadata),
    { from: recommender },
  );

  return requestIDs;
}

/**
 * Ask the Gatekeeper for permission and get back the requestIDs
 * @param {*} gatekeeper
 * @param {*} proposalData
 * @param {*} options
 */
async function getRequestIDs(gatekeeper, proposalData, options) {
  // console.log(options);
  const txOptions = options || {};

  const metadataHashes = proposalData.map(createMultihash);
  const requests = metadataHashes.map(md => gatekeeper.requestPermission(
    asBytes(md),
    txOptions,
  ));

  const receipts = await Promise.all(requests);
  const requestIDs = receipts.map((receipt) => {
    const { requestID } = receipt.logs[0].args;
    return requestID;
  });

  return requestIDs;
}

async function newSlate(gatekeeper, data, options) {
  const {
    batchNumber, category, proposalData, slateData,
  } = data;
  const requestIDs = await getRequestIDs(gatekeeper, proposalData, options);

  await gatekeeper.recommendSlate(batchNumber, category, requestIDs, asBytes(slateData), options);
  return requestIDs;
}


/**
 * Commit a ballot and return data for revealing
 * @param {*} gatekeeper
 * @param {*} voter
 * @param {*} category
 * @param {*} firstChoice
 * @param {*} secondChoice
 * @param {*} numTokens
 * @param {*} salt
 */
async function voteSingle(gatekeeper, voter, category, firstChoice, secondChoice, numTokens, salt) {
  const votes = {
    [category]: { firstChoice, secondChoice },
  };

  const commitHash = generateCommitHash(votes, salt);
  await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

  return {
    voter,
    categories: [category],
    firstChoices: [firstChoice],
    secondChoices: [secondChoice],
    salt,
  };
}

/**
 * Commit a ballot and return data for revealing
 * @param {*} gatekeeper
 * @param {*} voter
 * @param {*} ballot Array of [category, firstChoice, secondChoice] triples
 * @param {*} numTokens
 * @param {*} salt
 */
async function commitBallot(gatekeeper, voter, ballot, numTokens, salt) {
  const votes = {};
  ballot.forEach((data) => {
    const [category, firstChoice, secondChoice] = data;
    votes[category] = { firstChoice, secondChoice };
  });

  const commitHash = generateCommitHash(votes, salt);
  await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

  const categories = Object.keys(votes);
  return {
    voter,
    categories,
    firstChoices: categories.map(cat => votes[cat].firstChoice),
    secondChoices: categories.map(cat => votes[cat].secondChoice),
    salt,
  };
}

/**
 * Reveal a ballot
 * @param {Gatekeeper} gatekeeper
 * @param {*} revealData
 */
async function revealVote(gatekeeper, revealData) {
  const {
    voter, categories, firstChoices, secondChoices, salt,
  } = revealData;
  await gatekeeper.revealBallot(
    voter, categories, firstChoices, secondChoices, salt, { from: voter },
  );
}

/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 * @param {*} categories
 * @param {*} firstChoices
 * @param {*} secondChoices
 */
function encodeBallot(categories, firstChoices, secondChoices) {
  const types = ['uint256[]', 'uint256[]', 'uint256[]'];
  const values = [categories, firstChoices, secondChoices];

  const encoded = ethers.utils.defaultAbiCoder.encode(types, values);
  return encoded;
}

/**
 * Get the number of first and second choice votes for a slate in a contest
 * @param {*} gatekeeper
 * @param {*} ballotID
 * @param {*} categoryID
 * @param {*} slateID
 */
async function getVotes(gatekeeper, ballotID, categoryID, slateID) {
  const result = await Promise.all([
    gatekeeper.getFirstChoiceVotes(ballotID, categoryID, slateID),
    gatekeeper.getSecondChoiceVotes(ballotID, categoryID, slateID),
  ]);
  return result;
}


const ContestStatus = {
  Empty: '0',
  NoContest: '1',
  Started: '2',
  VoteFinalized: '3',
  RunoffPending: '4',
  RunoffFinalized: '5',
};

const SlateStatus = {
  Unstaked: '0',
  Staked: '1',
  Rejected: '2',
  Accepted: '3',
};


async function getLosingSlates(gatekeeper, slateIDs) {
  const ls = await Promise.all(slateIDs.map(id => gatekeeper.slates(id)));
  return ls.filter(s => s.status.toString() === SlateStatus.Rejected);
}


const utils = {
  expectRevert,
  expectEvents,
  expectErrorLike,
  zeroAddress: ethUtils.zeroAddress,
  BN: ethUtils.BN,
  createMultihash,
  newGatekeeper,
  newPanvala,
  asBytes,
  stripHexPrefix,
  bytesAsString,
  abiCoder,
  abiEncode,
  newToken,
  keccak: ethUtils.keccak,
  zeroHash,
  generateCommitHash,
  grantSlateFromProposals,
  getRequestIDs,
  newSlate,
  voteSingle,
  commitBallot,
  revealVote,
  ContestStatus,
  SlateStatus,
  encodeBallot,
  getVotes,
  categories: proposalCategories,
  getLosingSlates,
};

module.exports = utils;
