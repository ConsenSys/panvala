const { EthEvents } = require('eth-events');
const sortBy = require('lodash/sortBy');
const {
  contractABIs: { Gatekeeper, TokenCapacitor, ParameterStore },
} = require('../../packages/panvala-utils');

const { getContracts } = require('./eth');
const { mapRequestsToProposals } = require('./requests');
const { ContractEvent, Sequelize } = require('../models');

const { in: opIn } = Sequelize.Op;

const numRegex = /^([0-9]*)$/;

async function getAllEvents(fromBlock) {
  const {
    network,
    parameterStore,
    gatekeeper,
    tokenCapacitor,
    rpcEndpoint,
    genesisBlockNumber,
  } = await getContracts();
  // disable notifications on mainnet and rinkeby
  if (network.chainId === 4 || network.chainId === 1) {
    return [];
  }

  const contracts = [
    {
      abi: Gatekeeper.abi,
      address: gatekeeper.address,
    },
    {
      abi: TokenCapacitor.abi,
      address: tokenCapacitor.address,
    },
    {
      abi: ParameterStore.abi,
      address: parameterStore.address,
    },
  ];
  // init eth-events
  const ethEvents = EthEvents(contracts, rpcEndpoint, genesisBlockNumber);
  if (!fromBlock) {
    fromBlock = genesisBlockNumber;
  }

  // gatekeeper and tokenCapacitor filters
  const gkFilter = {
    fromBlock,
    address: gatekeeper.address,
  };
  const tcFilter = {
    fromBlock,
    address: tokenCapacitor.address,
  };
  const psFilter = {
    fromBlock,
    address: parameterStore.address,
  };

  try {
    // get all events
    const gkEvents = await ethEvents.getEventsByFilter(gkFilter);
    const tcEvents = await ethEvents.getEventsByFilter(tcFilter);
    const psEvents = await ethEvents.getEventsByFilter(psFilter);
    const events = gkEvents.concat(tcEvents).concat(psEvents);

    // set this to true if you want to map requests to proposals and write to db
    let saveRequests = true;
    if (saveRequests) {
      await mapRequestsToProposals(events, gatekeeper);
    }

    return events;
  } catch (error) {
    console.log('error:', error);
    return [];
  }
}

async function getParametersSet(fromBlock) {
  const { network, rpcEndpoint, genesisBlockNumber, parameterStore } = await getContracts();
  // disable notifications on mainnet and rinkeby
  if (network.chainId === 1 || network.chainId === 4) {
    // NOTE: will be an issue when rendering parameters other than
    // slateStakeAmount and gatekeeperAddress
    return [];
  }

  const contract = {
    abi: ParameterStore.abi,
    address: parameterStore.address,
  };

  const ethEvents = EthEvents([contract], rpcEndpoint, genesisBlockNumber);

  const filter = {
    fromBlock: fromBlock || genesisBlockNumber,
    address: parameterStore.address,
  };
  try {
    const events = await ethEvents.getEventsByFilter(filter);

    const parameterInitializedEvents = events.filter(e => e.name === 'ParameterSet');
    return parameterInitializedEvents.reduce((acc, val) => {
      return {
        [val.values.name]: val.values.value,
        ...acc,
      };
    }, {});
  } catch (error) {
    console.log('error:', error);
    return {};
  }
}

function processEvent(event) {
  const { values } = event;

  const prettyValue = v => {
    if (v.hasOwnProperty('_hex')) {
      return v.toString();
    }
    return v;
  };

  const emittedValues = Object.keys(values).reduce((acc, arg) => {
    let value = values[arg];

    // filter out numerical duplicates, like { 0: '0x1234', voter: '0x1234' }, and the `length` field
    const isNotNumber = !numRegex.test(arg);
    if (isNotNumber && arg !== 'length') {
      // handle arrays
      if (Array.isArray(value)) {
        // console.log('array', arg, value);
        value = value.map(prettyValue);
      } else {
        // convert ethers.js BigNumber -> string
        value = prettyValue(value);
      }

      return {
        ...acc,
        [arg]: value,
      };
    }
    return acc;
  }, []);

  return {
    ...event,
    values: emittedValues,
  };
}

/**
 * Get events from the most recent block we have seen and add them to the database
 * @param {number} fromBlock
 */
async function syncEvents(fromBlock) {
  // use the greatest block number from the events table as
  // the first block when querying for a range of recent txs
  return ContractEvent.max('blockNumber').then(async latestStoredBlock => {
    // get min of fromBlock and latestStoredBlock
    const startBlock = latestStoredBlock || fromBlock;

    const events = await getAllEvents(startBlock);
    console.log('');
    console.log('events:', events.length);

    // sort by timestamp
    const ordered = sortBy(events, 'timestamp');

    // sequentially add to db by block.timestamp
    for (let i = 0; i < ordered.length; i++) {
      const event = processEvent(ordered[i]);
      const { txHash, timestamp, blockNumber, sender, recipient, values, name, logIndex } = event;

      try {
        // add or re-write a row on the events table
        // events are uniquely identified by tx hash, event name, and log index
        await ContractEvent.findOrCreate({
          where: { txHash, name, logIndex },
          defaults: {
            txHash,
            timestamp,
            blockNumber,
            sender,
            recipient,
            name,
            logIndex,
            values,
          },
        });
      } catch (error) {
        console.error(`Could not add event ${name} at ${txHash}, ${logIndex}: ${error.message}`);
      }
    }

    return ordered.length;
  });
}

// Return the most recent events from the database, newest first
async function getEventsFromDatabase(config) {
  const { names, limit } = config || {};
  const where = {};
  const eventTypes = names || [];
  if (eventTypes.length > 0) {
    where['name'] = {
      [opIn]: eventTypes,
    };
  }

  return ContractEvent.findAll({
    where,
    order: [['timestamp', 'DESC'], ['logIndex', 'DESC']],
    limit,
    raw: true,
  });
}

module.exports = {
  getAllEvents,
  getParametersSet,
  syncEvents,
  getEventsFromDatabase,
};
