/* globals artifacts assert */
const ethUtils = require('ethereumjs-util');
const bs58 = require('bs58');

const Gatekeeper = artifacts.require('Gatekeeper');
const BasicToken = artifacts.require('BasicToken');

const { BN } = ethUtils;

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
};

module.exports = utils;
