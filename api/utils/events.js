const { EthEvents } = require('eth-events');
const {
  contractABIs: { Gatekeeper, TokenCapacitor, ParameterStore },
} = require('../../packages/panvala-utils');

const {
  contracts: { gatekeeperAddress, tokenCapacitorAddress, genesisBlockNumber },
  rpcEndpoint,
} = require('./config');

async function getAllEvents(fromBlock = genesisBlockNumber) {
  const contracts = [
    {
      abi: Gatekeeper.abi,
      address: gatekeeperAddress,
      name: 'Gatekeeper',
    },
    {
      abi: TokenCapacitor.abi,
      address: tokenCapacitorAddress,
      name: 'TokenCapacitor',
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

  // get events
  const gkEvents = await ethEvents.getEventsByFilter(gkFilter);
  const tcEvents = await ethEvents.getEventsByFilter(tcFilter);
  return gkEvents.concat(tcEvents);
}

async function getParameterStoreEvents(psAddress, fromBlock = genesisBlockNumber) {
  const parameterStore = {
    abi: ParameterStore.abi,
    address: psAddress,
    name: 'Parameter Store',
  };

  const ethEvents = EthEvents([parameterStore], rpcEndpoint, genesisBlockNumber);

  const filter = {
    fromBlock,
    address: psAddress,
  };
  const events = await ethEvents.getEventsByFilter(filter);

  const parameterInitializedEvents = events.filter(e => e.name === 'ParameterSet');
  return parameterInitializedEvents.reduce((acc, val) => {
    return {
      [val.values.name]: val.values.value,
      ...acc,
    };
  }, {});
}

module.exports = {
  getAllEvents,
  getParameterStoreEvents,
};
