/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');

const { abiEncode } = require('../utils');

// TODO: read deployment data from config file

// eslint-disable-next-line func-names
module.exports = async function (deployer) {
  const firstEpochTime = new Date('12:00 01 Feb 2019 EST');
  const startTime = Math.floor(firstEpochTime / 1000);

  const parameters = await ParameterStore.deployed();

  console.log(`Deploying Gatekeeper with ParameterStore ${parameters.address}`);

  const gatekeeper = await deployer.deploy(Gatekeeper, startTime, parameters.address);
  await parameters.setInitialValue(
    'gatekeeperAddress',
    abiEncode('address', gatekeeper.address),
  );
};
