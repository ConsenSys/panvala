const ethers = require('ethers');
const ethUtils = require('ethereumjs-util');

const { defaultAbiCoder: abiCoder } = ethers.utils;

/**
 * ABI-encode a value to pass to a contract function
 * @param {*} type
 * @param {*} value
 */
function abiEncode(type, value) {
  return abiCoder.encode([type], [value]);
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

module.exports = {
  BN: ethUtils.BN,
  abiEncode,
  asBytes,
  stripHexPrefix,
  bytesAsString,
  zeroHash,
  sha256: ethUtils.sha256,
};
