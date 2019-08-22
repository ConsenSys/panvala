const { EthEvents } = require('eth-events');
const {
  contractABIs: { Gatekeeper, TokenCapacitor, ParameterStore },
} = require('../../packages/panvala-utils');

const {
  contracts: { gatekeeperAddress, tokenCapacitorAddress, genesisBlockNumber },
  rpcEndpoint,
} = require('./config');
const { getContracts } = require('./eth');
const { mapRequestsToProposals } = require('./requests');

async function getAllEvents(fromBlock = genesisBlockNumber) {
  const { provider, gatekeeper } = getContracts();
  const network = await provider.getNetwork();
  // disable notifications on mainnet and rinkeby
  if (network.chainId === 4 || network.chainId === 1) {
    return [];
  }

  const psAddress = await gatekeeper.parameters();
  const contracts = [
    {
      abi: Gatekeeper.abi,
      address: gatekeeperAddress,
    },
    {
      abi: TokenCapacitor.abi,
      address: tokenCapacitorAddress,
    },
    {
      abi: ParameterStore.abi,
      address: psAddress,
    },
  ];
  // init eth-events
  const ethEvents = EthEvents(contracts, rpcEndpoint, genesisBlockNumber);

  // gatekeeper and tokenCapacitor filters
  const gkFilter = {
    fromBlock,
    address: gatekeeperAddress,
  };
  const tcFilter = {
    fromBlock,
    address: tokenCapacitorAddress,
  };
  const psFilter = {
    fromBlock,
    address: psAddress,
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

async function getParametersSet(psAddress, fromBlock = genesisBlockNumber) {
  const { provider } = getContracts();
  const network = await provider.getNetwork();
  // disable notifications on mainnet and rinkeby
  if (network.chainId === 420 || network.chainId === 1) {
    // NOTE: will be an issue when rendering parameters other than
    // slateStakeAmount and gatekeeperAddress
    return [];
  }

  const parameterStore = {
    abi: ParameterStore.abi,
    address: psAddress,
  };

  const ethEvents = EthEvents([parameterStore], rpcEndpoint, genesisBlockNumber);

  const filter = {
    fromBlock,
    address: psAddress,
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

module.exports = {
  getAllEvents,
  getParametersSet,
};
