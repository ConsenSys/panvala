const ethers = require('ethers');
const ipfs = require('./ipfs');
const range = require('lodash/range');

const { Slate } = require('../models');

const {
  contractABIs: { Gatekeeper, ParameterStore },
} = require('../../packages/panvala-utils');

const { toUtf8String } = ethers.utils;

const config = require('./config');
const { rpcEndpoint } = config;
const { gatekeeperAddress, tokenCapacitorAddress } = config.contracts;

const { nonEmptyString } = require('./validation');

const BN = small => ethers.utils.bigNumberify(small);
const getAddress = hexAddress => ethers.utils.getAddress(hexAddress);

/**
 * Read slate info from the blockchain, IPFS, and the local DB
 */
async function getAllSlates() {
  // Get an interface to the Gatekeeper contract
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, provider);

  // Get an interface to the ParameterStore contract
  const parameterStoreAddress = await gatekeeper.functions.parameters();
  const parameterStore = new ethers.Contract(parameterStoreAddress, ParameterStore.abi, provider);
  // Get the slate staking requirement
  const requiredStake = await parameterStore.functions.get('slateStakeAmount');

  // Get the number of available slates
  const slateCount = await gatekeeper.functions.slateCount();
  console.log(`fetching ${slateCount} slates`);
  const currentEpoch = await gatekeeper.functions.currentEpochNumber();
  console.log('currentEpoch:', currentEpoch);

  // 0..slateCount
  const ids = range(0, slateCount);
  // console.log('IDs', ids);

  const slatePromises = ids.map(slateID => {
    // give access to this variable throughout the chain
    return gatekeeper
      .slates(slateID)
      .then(({ recommender, metadataHash, status, staker, stake, epochNumber, resource }) => {
        // decode hash
        const decoded = toUtf8String(metadataHash);
        // console.log('decoded hash', decoded);
        return {
          slateID,
          status,
          decoded,
          recommenderAddress: recommender,
          staker,
          stake,
          epochNumber,
          resource,
        };
      })
      .then(slate => {
        console.log('slate:', slate);
        return getSlateWithMetadata(slate, slate.decoded, requiredStake, currentEpoch);
      });
  });

  return Promise.all(slatePromises);
}

/**
 * Get the slate metadata by combining data from multiple sources
 * @param {ethers.Contract} slate
 * @param {String} metadataHash
 * @param {ethers.BigNumber} requiredStake
 */
async function getSlateWithMetadata(slate, metadataHash, requiredStake, currentEpoch) {
  try {
    // the slate as it exists in the db:
    const [dbSlate] = await Slate.findOrBuild({
      where: {
        slateID: slate.slateID,
      },
      defaults: {
        slateID: slate.slateID,
        metadataHash,
        email: '',
        verifiedRecommender: false,
      },
    });

    // --------------------------
    // IPFS -- slate metadata
    // --------------------------
    const slateMetadata = await ipfs.get(metadataHash, { json: true });
    const {
      firstName,
      lastName,
      proposals,
      title,
      description,
      organization,
      proposalMultihashes,
    } = slateMetadata;
    console.log('proposalMultihashes:', proposalMultihashes);
    console.log('');

    // TODO: rehydrate proposals

    // TODO: get real data
    const deadline = 1539044131;

    let incumbent = false;
    // prettier-ignore
    if (
      slate.status === 3 &&
      BN(slate.epochNumber).eq(BN(currentEpoch)).sub('1')
    ) {
      incumbent = true;
    }

    let category = 'GOVERNANCE';
    if (getAddress(slate.resource) === getAddress(tokenCapacitorAddress)) {
      category = 'GRANT';
    }

    // --------------------------
    // COMBINE/RETURN SLATE DATA
    // --------------------------
    const slateData = {
      id: slate.slateID, // should we call this slateID instead of id? we're already using slateID as the primary key in the slates table
      metadataHash,
      category,
      status: slate.status,
      deadline,
      title,
      description,
      organization,
      incumbent,
      proposals,
      requiredStake,
      staker: slate.staker,
      // either first + last name or just first name
      owner: lastName ? `${firstName} ${lastName}` : firstName,
      recommenderAddress: slate.recommenderAddress,
      verifiedRecommender: dbSlate.verifiedRecommender,
    };
    return slateData;
  } catch (error) {
    console.log('ERROR: while combining slate with metadata: ', error.message);
    throw error;
  }
}

/**
 * Data received in a POST request
 */
const slateSchema = {
  slateID: {
    in: ['body'],
    exists: true,
    // parse as integer
    toInt: true,
    isInt: true,
  },
  metadataHash: {
    in: ['body'],
    exists: true,
    ...nonEmptyString,
  },
  email: {
    in: ['body'],
    trim: true,
    // is a valid email if present
    isEmail: true,
    optional: {
      options: {
        // Allow empty emails
        checkFalsy: true,
      },
    },
  },
};

module.exports = {
  getAllSlates,
  slateSchema,
};
