/* globals artifacts assert */
const ethUtils = require('ethereumjs-util');
const bs58 = require('bs58');
const ethers = require('ethers');


const Gatekeeper = artifacts.require('Gatekeeper');
const BasicToken = artifacts.require('BasicToken');

const { BN } = ethUtils;
const { solidityKeccak256 } = ethers.utils;

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

function createMultihash(data) {
  const digest = ethUtils.sha256(data);

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

async function newGatekeeper(options) {
  const { from: creator } = options;
  let { tokenAddress } = options;

  // Deploy a token if the address of one isn't passed in
  if (typeof tokenAddress === 'undefined') {
    const token = await newToken({ from: creator });
    tokenAddress = token.address;
  }

  // console.log('using token at address', tokenAddress);

  const startTime = '6000';
  const stakeAmount = '5000';
  const gatekeeper = await Gatekeeper.new(tokenAddress, startTime, stakeAmount, { from: creator });

  return gatekeeper;
}


function asBytes(string) {
  return ethUtils.toBuffer(string);
}

/**
 * stripHexPrefix
 * Remove '0x' from the beginning of a string, if present
 * @param {String} value
 * @return String
 */
function stripHexPrefix(value) {
  // assume string
  const stripped = value.startsWith('0x') ? value.substring(2) : value;
  return stripped;
}

/**
 * bytesAsString
 * @param {String} bytes Hex-encoded string returned from a contract
 * @return UTF-8 encoded string
 */
function bytesAsString(bytes) {
  const stripped = stripHexPrefix(bytes);
  const decoded = Buffer.from(stripHexPrefix(stripped), 'hex');
  return decoded.toString();
}

/**
 * zeroHash
 * @dev Return a 32-byte value of all zeros
 */
function zeroHash() {
  return ethUtils.zeros(32);
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

const utils = {
  expectRevert,
  zeroAddress: ethUtils.zeroAddress,
  BN: ethUtils.BN,
  createMultihash,
  newGatekeeper,
  asBytes,
  stripHexPrefix,
  bytesAsString,
  newToken,
  keccak: ethUtils.keccak,
  zeroHash,
  generateCommitHash,
  getRequestIDs,
  newSlate,
  voteSingle,
  commitBallot,
  revealVote,
  ContestStatus,
  SlateStatus,
  encodeBallot,
  getVotes,
};

module.exports = utils;
