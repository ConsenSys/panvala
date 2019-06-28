/* globals artifacts assert */
const ethUtils = require('ethereumjs-util');
const bs58 = require('bs58');
const ethers = require('ethers');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

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

const testProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

const ONE_WEEK = new BN('604800');
const timing = {
  ONE_SECOND: new BN(1),
  ONE_DAY: new BN(3600 * 24),
  ONE_WEEK,
  EPOCH_LENGTH: ONE_WEEK.mul(new BN(13)),
  VOTING_PERIOD_START: ONE_WEEK.mul(new BN(11)),
  COMMIT_PERIOD_LENGTH: ONE_WEEK,
  REVEAL_PERIOD_LENGTH: ONE_WEEK,
};

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
  const a = error.toString().toLowerCase();
  assert(a.includes(substring.toLowerCase()), msg);
}

/**
 * Increase the EVM time by `seconds` seconds
 * @param {BN} seconds
 */
async function increaseTime(seconds) {
  const adjustment = await testProvider.send('evm_increaseTime', [seconds.toNumber()]);
  await testProvider.send('evm_mine', []);
  return adjustment;
}

/**
 * Save a snapshot of the current EVM state
 */
async function evmSnapshot() {
  const id = await testProvider.send('evm_snapshot');
  // console.log('Saving snapshot', id);
  return id;
}

/**
 * Revert to a saved EVM snapshot state
 * @param {Number} snapshotID
 */
async function evmRevert(snapshotID) {
  // console.log('Reverting to snapshot', snapshotID);
  await testProvider.send('evm_revert', [snapshotID]);
}

/**
 * Get the timestamp of the given block
 * @param {Number} blockNumber
 */
async function blockTime(blockNumber) {
  if (typeof blockNumber !== 'undefined') {
    return testProvider.getBlock(blockNumber)
      .then(block => block.timestamp);
  }

  return testProvider
    .getBlockNumber()
    .then(number => testProvider.getBlock(number))
    .then(block => block.timestamp);
}

async function futureTime(seconds) {
  const now = await blockTime();
  const offset = BN.isBN(seconds) ? seconds : new BN(seconds);
  return (new BN(now)).add(offset);
}

/**
 *
 * @param {BN} timestamp
 */
async function goTo(timestamp) {
  const now = await blockTime();
  // console.log(timestamp.toNumber(), now);
  const adjustment = timestamp.sub(new BN(now));
  await increaseTime(adjustment);
}

/**
 * Print a BN date nicely
 * @param {BN} bn
 */
function printDate(bn) {
  const dt = bn.toString();
  return `${moment(dt, 'X')} ${dt}`;
}

/**
 *@param {number} n
 */
function range(n) {
  return [...Array(n).keys()];
}

/**
 * Run promises in sequential order
 * From https://stackoverflow.com/a/41115086
 * @param {Array[Promise]} promises Functions returning promises
 */
function chain(promises) {
  const chained = promises.reduce(
    (promise, f) => promise.then(result => f().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]),
  );
  return chained;
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
  const {
    from: creator, parameterStoreAddress, startTime, init = true,
  } = options;
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

  // deploy a Gatekeeper
  let systemStart = startTime;
  // Default start time is now
  if (typeof systemStart === 'undefined') {
    systemStart = Math.floor((new Date()).getTime() / 1000);
  }
  const gatekeeper = await Gatekeeper.new(systemStart, parameters.address, { from: creator });
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
 * Get the number of weeks into the current epoch
 * @param {Gatekeeper} gatekeeper
 * @param {*} dt
 */
async function epochTime(gatekeeper, dt, units) {
  const epoch = await gatekeeper.currentEpochNumber();
  const start = await gatekeeper.epochStart(epoch);
  const s = moment(start.toString(), 'X');
  const now = moment(dt.toString(), 'X');
  const elapsed = moment.duration(now.diff(s));
  return elapsed.as(units || 'weeks');
}

/**
 * generateCommitHash
 * keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {*} votes { resource: { firstChoice, secondChoice }}
 * @param {ethUtils.BN} salt Random 256-bit number
 */
function generateCommitHash(votes, salt) {
  const types = [];
  const values = [];

  Object.keys(votes).forEach((resource) => {
    const { firstChoice, secondChoice } = votes[resource];
    types.push('address', 'uint', 'uint');
    values.push(resource, firstChoice, secondChoice);
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
 * @returns proposalIDs
 */
async function grantSlateFromProposals(options) {
  const {
    gatekeeper, capacitor, proposals, recommender, metadata,
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
    capacitor.address,
    requestIDs,
    asBytes(metadata),
    { from: recommender },
  );

  const proposalIDs = receipt.logs.map(l => l.args.proposalID);
  return proposalIDs;
}

/**
 * Create a governance proposal slate from proposal info
 * options include: gatekeeper, parameterStore, proposals, recommender, metadata
 * @param {*} options
 * @returns proposalIDs
 */
async function governanceSlateFromProposals(options) {
  const {
    gatekeeper, parameterStore, proposals, recommender, metadata,
  } = options;

  const keys = [];
  const values = [];
  const metadataHashes = [];
  proposals.forEach((p) => {
    keys.push(p.key);
    values.push(p.value);
    metadataHashes.push(asBytes(p.metadataHash));
  });

  const receipt = await parameterStore.createManyProposals(
    keys,
    values,
    metadataHashes,
    { from: recommender },
  );

  const requestIDs = receipt.logs.map(l => l.args.requestID);

  await gatekeeper.recommendSlate(
    parameterStore.address,
    requestIDs,
    asBytes(metadata),
    { from: recommender },
  );

  const proposalIDs = receipt.logs.map(l => l.args.proposalID);
  return proposalIDs;
}

/**
 * Get the associated resource address by name
 * @param {*} gatekeeper
 * @param {string} name
 */
async function getResource(gatekeeper, name) {
  const parametersAddress = await gatekeeper.parameters();
  let source;

  if (name === 'GRANT') {
    const parameterStore = await ParameterStore.at(parametersAddress);
    source = await parameterStore.getAsAddress('tokenCapacitorAddress');
  } else if (name === 'GOVERNANCE') {
    source = parametersAddress;
  } else {
    console.error('Some unknown resource');
    throw new Error(`invalid resource ${name}`);
  }

  return source;
}

/**
 * Commit a ballot and return data for revealing
 * @param {*} gatekeeper
 * @param {*} voter
 * @param {*} resource
 * @param {*} firstChoice
 * @param {*} secondChoice
 * @param {*} numTokens
 * @param {*} salt
 */
async function voteSingle(gatekeeper, voter, resource, firstChoice, secondChoice, numTokens, salt) {
  const votes = {
    [resource]: { firstChoice, secondChoice },
  };

  const commitHash = generateCommitHash(votes, salt);
  await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

  return {
    voter,
    resources: [resource],
    firstChoices: [firstChoice],
    secondChoices: [secondChoice],
    salt,
  };
}

/**
 * Commit a ballot and return data for revealing
 * @param {*} gatekeeper
 * @param {*} voter
 * @param {*} ballot Array of [resource, firstChoice, secondChoice] triples
 * @param {*} numTokens
 * @param {*} salt
 */
async function commitBallot(gatekeeper, voter, ballot, numTokens, salt) {
  const votes = {};
  ballot.forEach((data) => {
    const [resource, firstChoice, secondChoice] = data;
    votes[resource] = { firstChoice, secondChoice };
  });

  const commitHash = generateCommitHash(votes, salt);
  await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

  const resources = Object.keys(votes);
  return {
    voter,
    resources,
    firstChoices: resources.map(cat => votes[cat].firstChoice),
    secondChoices: resources.map(cat => votes[cat].secondChoice),
    salt,
  };
}

/**
 * Reveal a ballot
 * @param {Gatekeeper} gatekeeper
 * @param {*} revealData
 */
async function revealVote(ballotID, gatekeeper, revealData) {
  const {
    voter, resources, firstChoices, secondChoices, salt,
  } = revealData;
  await gatekeeper.revealBallot(
    ballotID, voter, resources, firstChoices, secondChoices, salt, { from: voter },
  );
}

/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 * @param {*} resources
 * @param {*} firstChoices
 * @param {*} secondChoices
 */
function encodeBallot(resources, firstChoices, secondChoices) {
  const types = ['address[]', 'uint256[]', 'uint256[]'];
  const values = [resources, firstChoices, secondChoices];

  const encoded = ethers.utils.defaultAbiCoder.encode(types, values);
  return encoded;
}

/**
 * Get the number of first and second choice votes for a slate in a contest
 * @param {*} gatekeeper
 * @param {*} ballotID
 * @param {*} resource
 * @param {*} slateID
 */
async function getVotes(gatekeeper, ballotID, resource, slateID) {
  const result = await Promise.all([
    gatekeeper.getFirstChoiceVotes(ballotID, resource, slateID),
    gatekeeper.getSecondChoiceVotes(ballotID, resource, slateID),
  ]);
  return result;
}

const ContestStatus = {
  Empty: '0',
  NoContest: '1',
  Active: '2',
  RunoffPending: '3',
  Finalized: '4',
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

function loadDecayMultipliers() {
  const filePath = path.join(__dirname, 'multipliers.json');
  const doc = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return JSON.parse(doc);
}

function loadTokenReleases() {
  const filePath = path.join(__dirname, 'tokenReleases.json');
  const doc = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return JSON.parse(doc);
}

async function chargeCapacitor(capacitor, numTokens, token, txOptions) {
  await token.transfer(capacitor.address, numTokens, txOptions);
  await capacitor.updateBalances(txOptions);
}

async function capacitorBalances(capacitor) {
  const [unlocked, locked] = await Promise.all([
    capacitor.unlockedBalance(),
    capacitor.lastLockedBalance(),
  ]);

  return { unlocked, locked };
}

const utils = {
  expectRevert,
  expectEvents,
  expectErrorLike,
  zeroAddress: ethUtils.zeroAddress,
  BN,
  evm: {
    increaseTime, snapshot: evmSnapshot, revert: evmRevert, timestamp: blockTime, futureTime, goTo,
  },
  createMultihash,
  newGatekeeper,
  newPanvala,
  epochTime,
  printDate,
  range,
  chain,
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
  governanceSlateFromProposals,
  getResource,
  voteSingle,
  commitBallot,
  revealVote,
  ContestStatus,
  SlateStatus,
  encodeBallot,
  getVotes,
  categories: proposalCategories,
  getLosingSlates,
  timing,
  loadDecayMultipliers,
  loadTokenReleases,
  capacitorBalances,
  chargeCapacitor,
};

module.exports = utils;
