const ethers = require('ethers');
const ipfs = require('./ipfs');
const range = require('lodash/range');
const { Promise } = require('bluebird');

const { IpfsMetadata, Slate } = require('../models');

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
  let grantsIncumbent, governanceIncumbent;
  if (gatekeeper.functions.hasOwnProperty('incumbent')) {
    grantsIncumbent = await gatekeeper.functions.incumbent(tokenCapacitorAddress);
    governanceIncumbent = await gatekeeper.functions.incumbent(parameterStoreAddress);
  }

  // 0..slateCount
  const slateIDs = range(0, slateCount);
  console.log('slateIDs', slateIDs);

  // TEMPORARY HACK
  let slateIDsToQuery = slateIDs;
  const network = await provider.getNetwork();
  if (network.chainId === 4) {
    const garbage = [0, 1, 2, 3, 5];
    const filtered = slateIDs.filter(id => !garbage.includes(id));
    slateIDsToQuery = filtered;
  }

  const slates = await Promise.map(
    slateIDsToQuery,
    async (slateID, index) => {
      if (index !== 0) await Promise.delay(1000);
      // console.log('slateID:', slateID);
      const slate = await gatekeeper.slates(slateID);
      // decode hash
      const decoded = toUtf8String(slate.metadataHash);
      // console.log('decoded hash', decoded);
      let incumbent = false;
      if (slate.recommender === grantsIncumbent && slate.resource === tokenCapacitorAddress) {
        incumbent = true;
      } else if (
        slate.recommender === governanceIncumbent &&
        slate.resource === parameterStoreAddress
      ) {
        incumbent = true;
      }

      // manually reject slates that are old and not accepted
      if (BN(slate.epochNumber).lt(currentEpoch) && slate.status !== 3) {
        slate.status = 2;
      }

      console.log('slate:', slate);
      return getSlateWithMetadata(slateID, slate, decoded, incumbent, requiredStake);
    },
    { concurrency: 5 }
  );

  return slates;
}

/**
 * Get the slate metadata by combining data from multiple sources
 * @param {ethers.Contract} slate
 * @param {Number} slateID
 * @param {String} metadataHash
 * @param {Boolean} incumbent
 * @param {ethers.BigNumber} requiredStake
 */
async function getSlateWithMetadata(slateID, slate, metadataHash, incumbent, requiredStake) {
  try {
    // the slate as it exists in the db:
    const [dbSlate] = await Slate.findOrBuild({
      where: {
        slateID: slateID,
      },
      defaults: {
        slateID: slateID,
        metadataHash,
        email: '',
        verifiedRecommender: false,
      },
    });

    console.log();
    console.log('getting slate metadata:', metadataHash);
    // --------------------------
    // IPFS -- slate metadata
    // --------------------------
    let slateMetadata;
    try {
      const dbIpfsMetadata = await IpfsMetadata.findOne({
        where: {
          multihash: metadataHash,
        },
        raw: true,
      });
      slateMetadata = dbIpfsMetadata.data;
    } catch (error) {
      console.log('Slate metadata not found in db. Getting from ipfs..');
      slateMetadata = await ipfs.get(metadataHash, { json: true });
      // write to db since there's not a row already
      await IpfsMetadata.create({
        multihash: metadataHash,
        data: slateMetadata,
      });
    }

    const {
      firstName,
      lastName,
      proposals,
      description,
      organization,
      proposalMultihashes,
    } = slateMetadata;
    console.log('proposalMultihashes:', proposalMultihashes);
    console.log('');

    // TODO: rehydrate proposals

    let category = 'GOVERNANCE';
    if (getAddress(slate.resource) === getAddress(tokenCapacitorAddress)) {
      category = 'GRANT';
    }

    // --------------------------
    // COMBINE/RETURN SLATE DATA
    // --------------------------
    const slateData = {
      id: slateID, // should we call this slateID instead of id? we're already using slateID as the primary key in the slates table
      category,
      epochNumber: slate.epochNumber.toNumber(),
      incumbent,
      description,
      metadataHash,
      organization,
      // either first + last name or just first name
      owner: lastName ? `${firstName} ${lastName}` : firstName,
      proposals,
      recommender: slate.recommender,
      requiredStake,
      stake: slate.stake,
      staker: slate.staker,
      status: slate.status,
      verifiedRecommender: dbSlate.verifiedRecommender,
    };
    return slateData;
  } catch (error) {
    console.log('ERROR: while combining slate with metadata:', error.message);
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
