/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const TokenCapacitor = artifacts.require('TokenCapacitor');
const BasicToken = artifacts.require('BasicToken');


// TODO: read deployment data from config file

// eslint-disable-next-line func-names
module.exports = function (deployer, network) {
  // deploy Gatekeeper and TokenCapacitor
  const startTime = '6000';
  const stakeAmount = '5000';

  const devNetworks = ['development', 'coverage'];
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
    const supply = 1e26;


    let maybeToken;
    // Check for valid address
    if (tokenAddress.length === 22) {
      maybeToken = Promise.resolve(tokenAddress);
    } else {
      maybeToken = deployer.deploy(BasicToken, name, symbol, decimals, supply);
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
