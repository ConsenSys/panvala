/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const TokenCapacitor = artifacts.require('TokenCapacitor');


// TODO: read deployment data from config file

// eslint-disable-next-line func-names
module.exports = function (deployer) {
  // deploy Gatekeeper and TokenCapacitor
  const startTime = '6000';
  const stakeAmount = '5000000000000000000000';

  deployer.deploy(Gatekeeper, startTime, stakeAmount)
    .then(gatekeeper => deployer.deploy(TokenCapacitor, gatekeeper.address));
};
