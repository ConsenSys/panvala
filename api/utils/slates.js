const ethers = require('ethers');
const ipfs = require('./ipfs');

const Gatekeeper = require('../../abis/Gatekeeper.json');
const Slate = require('../../abis/Slate.json');
const ParameterStore = require('../../abis/ParameterStore.json');

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

        slate = new ethers.Contract(slateAddress, Slate.abi, provider);
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
        return getSlateMetadata(slate, slateID, metadataHash, requiredStake);
      });
  });

  return Promise.all(slatePromises);
}

/**
 * Get the slate metadata by combining data from multiple sources
 * @param {ethers.Contract} slate
 * @param {String} metadataHash
 */
async function getSlateMetadata(slate, slateID, metadataHash, requiredStake) {
  // TODO: get real data
  const deadline = 1539044131;

  const metadata = await ipfs.get(metadataHash);

  // get the slate's current status & the account that recommended this slate:
  const status = await slate.status();
  const ownerAddress = await slate.recommender();

  // get from database
  const incumbent = false;
  const owner = metadata.owner;

  // TODO: rehydrate proposals
  const proposals = metadata.proposals;

  const slateMetadata = {
    id: slateID,
    metadataHash,
    category: 'GRANT',
    status,
    deadline,
    title: metadata.title,
    description: metadata.description,
    owner,
    ownerAddress,
    incumbent,
    proposals,
    requiredStake,
  };
  return slateMetadata;
}


/**
 * Data received in a POST request
 */
const slateSchema = {
  slateID: {
    in: ['body'],
    exists: true,
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
  }
};

module.exports = {
  getAllSlates,
  slateSchema,
};
