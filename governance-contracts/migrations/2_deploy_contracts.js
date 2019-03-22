/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const TokenCapacitor = artifacts.require('TokenCapacitor');
const BasicToken = artifacts.require('BasicToken');


// TODO: read deployment data from config file

// eslint-disable-next-line func-names
module.exports = function (deployer, network) {
  // deploy Gatekeeper and TokenCapacitor
  const firstEpochTime = new Date('01 Feb 2019 GMT');
  const startTime = Math.floor(firstEpochTime / 1000);
  const stakeAmount = '5000000000000000000000';

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


    // resolve to a token address
    let maybeToken;
    // Check for valid address
    if (tokenAddress.length === 22) {
      maybeToken = Promise.resolve(tokenAddress);
    } else {
      maybeToken = deployer.deploy(BasicToken, name, symbol, decimals, supply)
        .then(token => token.address);
    }

    maybeToken.then(_tokenAddress => deployer.deploy(
      Gatekeeper,
      _tokenAddress,
      startTime,
      stakeAmount,
    ))
      .then(gatekeeper => deployer.deploy(TokenCapacitor, gatekeeper.address));
  }
};
