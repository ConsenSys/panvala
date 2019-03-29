const ethers = require('ethers');
const ipfs = require('./ipfs');

const { Slate } = require('../models');

const Gatekeeper = require('../contracts/Gatekeeper.json');
const SlateJSON = require('../contracts/Slate.json');
const ParameterStore = require('../contracts/ParameterStore.json');

const { toUtf8String } = ethers.utils;

const config = require('./config');
const { rpcEndpoint } = config;
const { gatekeeperAddress } = config.contracts;

const { nonEmptyString } = require('./validation');

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

  // 0..slateCount
  const ids = Array.from(Array(slateCount.toNumber()).keys());
  // console.log('IDs', ids);

  // give access to this variable throughout the loop
  let slate;
  const slatePromises = ids.map(slateID => {
    return gatekeeper
      .slates(slateID)
      .then(slateAddress => {
        // console.log('slate at:', slateAddress);

        slate = new ethers.Contract(slateAddress, SlateJSON.abi, provider);
        return slate.metadataHash();
      })
      .then(metadataHash => {
        // console.log('hash', metadataHash);

        // decode hash
        const decoded = toUtf8String(metadataHash);
        // console.log('decoded hash', decoded);
        return decoded;
      })
      .then(metadataHash => {
        return getSlateWithMetadata(slate, slateID, metadataHash, requiredStake);
      });
  });

  return Promise.all(slatePromises);
}

/**
 * Get the slate metadata by combining data from multiple sources
 * @param {ethers.Contract} slate
 * @param {number} slateID
 * @param {String} metadataHash
 * @param {ethers.BigNumber} requiredStake
 */
async function getSlateWithMetadata(slate, slateID, metadataHash, requiredStake) {
  try {
    // the slate as it exists in the db:
    const dbSlate = await Slate.find({
      where: {
        slateID,
      },
    });

    // --------------------------
    // IPFS -- slate metadata
    // --------------------------
    const slateMetadata = await ipfs.get(metadataHash);
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

    // --------------------------
    // CONTRACTS CALLS
    // --------------------------
    // get the slate's current status & the account that recommended this slate:
    const slateStatus = await slate.status();
    const ownerAddress = await slate.recommender();

    // TODO: rehydrate proposals

    // TODO: get real data
    const deadline = 1539044131;
    // TODO: get from database
    const incumbent = false;

    // --------------------------
    // COMBINE/RETURN SLATE DATA
    // --------------------------
    const slateData = {
      id: slateID, // should we call this slateID instead of id? we're already using slateID as the primary key in the slates table
      metadataHash,
      category: 'GRANT',
      slateStatus,
      deadline,
      title,
      description,
      organization,
      ownerAddress,
      incumbent,
      proposals,
      requiredStake,
      // either first + last name or just first name
      owner: lastName ? `${firstName} ${lastName}` : firstName,
      verifiedRecommender: dbSlate.verifiedRecommender,
    };
    return slateData;
  } catch (error) {
    console.log('error while combining slate with metadata', error);
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
