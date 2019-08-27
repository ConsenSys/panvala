const ethers = require('ethers');
const config = require('./config');
const {
  rpcEndpoint,
  contracts: { gatekeeperAddress, tokenCapacitorAddress, parameterStoreAddress },
} = config;

const {
  contractABIs: { Gatekeeper, TokenCapacitor, ParameterStore },
} = require('../../packages/panvala-utils');

/**
 * Check connection
 */
function checkConnection() {
  // console.log('Connecting to', rpcEndpoint);
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

  return provider.getBlockNumber();
}

const genBlocks = {
  1: 8392794, // https://etherscan.io/tx/0xbc5870bb3e40f9f81146b018739d274c10f672c33c1128c52aeb750311cdfa45
  4: 4922926, // https://rinkeby.etherscan.io/tx/0xb120388b78f9fc9d75447c06817e590237635338f43720e4d85d6c83d4393ffc
  unknown: 1,
};

async function getContracts() {
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const parameterStore = new ethers.Contract(parameterStoreAddress, ParameterStore.abi, signer);
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);
  const tokenCapacitor = new ethers.Contract(tokenCapacitorAddress, TokenCapacitor.abi, signer);
  const genesisBlockNumber = genBlocks[network.chainId] || genBlocks.unknown;

  return {
    signer,
    provider,
    network,
    rpcEndpoint,
    parameterStore,
    gatekeeper,
    tokenCapacitor,
    genesisBlockNumber,
  };
}

module.exports = {
  checkConnection,
  getContracts,
};
