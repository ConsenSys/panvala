const ethers = require('ethers');
const config = require('./config');
const { rpcEndpoint } = config;

/**
 * Check connection
 */
function checkConnection() {
  // console.log('Connecting to', rpcEndpoint);
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

  return provider.getBlockNumber();
}

module.exports = {
  checkConnection,
};
