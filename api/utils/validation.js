const Ajv = require('ajv');

const ethers = require('ethers');
const {
  isHexString,
  hexDataLength,
  bigNumberify
} = ethers.utils;

const { ballotSchema } = require('./schemas');

const ajv = new Ajv();

// Add special keyword to the schema for interpreting fields as (positive) bigNumber
ajv.addKeyword('bigNumber', {
  type: 'string',
  validate: function(schema, data) {
    // If `bigNumber: false`, then don't do anything
    if (!schema) {
      return true;
    }

    // Otherwise, check if it's a bigNumber
    try {
      const parsed = bigNumberify(data);
      const isPositive = parsed.gte(ethers.constants.Zero);
      // console.log(isPositive);
      return isPositive;
    } catch (error) {
      return false;
    }
  },
});

const validateBallot = ajv.compile(ballotSchema);

/**
 * Throw if the value is not a '0x'-prefixed, 20-byte hex string.
 * @param {String} value
 */
function isEthereumAddress(value) {
  if (isHexString(value) === false) {
    throw new Error('value must be a hex string');
  }

  if (hexDataLength(value) != 20) {
    throw new Error('value must be a 20-byte hex string');
  }

  return value;
}

const nonEmptyString = {
  exists: true,
  trim: true,
  isEmpty: false,
  isLength: {
    options: {
      min: 1,
    },
  },
};

function isObject(value) {
  try {
    Object.keys(value);
  } catch (error) {
    throw new Error('value must be an object');
  }

  return value;
}

/**
 * isBigNumber - Throw if the value can't be parsed as a BigNumber
 * @param {Bignumberish} value
 */
function isBigNumber(value) {
  try {
    bigNumberify(value);
  } catch (error) {
    throw new Error('value must represent a BigNumber');
  }

  return value;
}

module.exports = {
  nonEmptyString,
  isEthereumAddress,
  isObject,
  isBigNumber,
  validateBallot,
};
