const ethers = require('ethers');
const config = require('./config');
const { rpcEndpoint } = config;
const { gatekeeperAddress, tokenCapacitorAddress } = config.contracts;

const {
  contractABIs: { Gatekeeper, TokenCapacitor },
} = require('../../packages/panvala-utils');

/**
 * Check connection
 */
function checkConnection() {
  // console.log('Connecting to', rpcEndpoint);
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

  return provider.getBlockNumber();
}

function getContracts() {
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const signer = provider.getSigner();
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);
  const tokenCapacitor = new ethers.Contract(tokenCapacitorAddress, TokenCapacitor.abi, signer);

  return {
    signer,
    provider,
    gatekeeper,
    tokenCapacitor,
  };
}

module.exports = {
  checkConnection,
  getContracts,
};
