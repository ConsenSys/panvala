/* eslint-disable no-console */
/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');

const { abiEncode } = require('../utils');

// eslint-disable-next-line func-names
module.exports = async function (deployer) {
  const { gatekeeper: config } = global.panvalaConfig;
  const { firstEpochStart } = config;

  const firstEpochTime = new Date(firstEpochStart);
  const startTime = Math.floor(firstEpochTime / 1000);
  // console.log(startTime);

  const parameters = await ParameterStore.deployed();

  console.log(`Deploying Gatekeeper with ParameterStore ${parameters.address}`);

  const gatekeeper = await deployer.deploy(Gatekeeper, startTime, parameters.address);
  await parameters.setInitialValue(
    'gatekeeperAddress',
    abiEncode('address', gatekeeper.address),
  );
};
