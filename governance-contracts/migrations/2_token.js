/* eslint-disable consistent-return */
/* globals artifacts */
const BasicToken = artifacts.require('BasicToken');

const { isValidAddress } = require('ethereumjs-util');

// TODO: read deployment data from config file

// eslint-disable-next-line func-names
module.exports = function (deployer, network) {
  const devNetworks = ['coverage'];
  const isDev = devNetworks.indexOf(network) !== -1;

  // Do not deploy a token on the dev networks
  if (isDev) {
    // console.log('skipping deployment');
  } else {
    // TODO: read from file
    const tokenAddress = '';
    const name = 'Basic Token';
    const symbol = 'BSC';
    const decimals = '18';
    const supply = `1${'0'.repeat(26)}`; // 1e26

    if (isValidAddress(tokenAddress)) {
      console.log(`Using token at ${tokenAddress}`);
    } else {
      return deployer.deploy(BasicToken, name, symbol, decimals, supply);
    }
  }
};
