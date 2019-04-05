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

async function getRequestIDs(gatekeeper, proposalData, options) {
  // console.log(options);
  options = options || {};

  const metadataHashes = proposalData.map(createMultihash);
  const requests = metadataHashes.map(md => gatekeeper.requestPermission(
    asBytes(md),
    options,
  ));

  const receipts = await Promise.all(requests);
  const requestIDs = receipts.map((receipt) => {
    const { requestID } = receipt.logs[0].args;
    return requestID;
  });

  return requestIDs;
}

async function newSlate(gatekeeper, data, options) {
  const { batchNumber, category, proposalData, slateData } = data;
  const requestIDs = await getRequestIDs(gatekeeper, proposalData, options);

  await gatekeeper.recommendSlate(batchNumber, category, requestIDs, asBytes(slateData), options);
  return requestIDs;
}
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
};

module.exports = utils;
