/* eslint-disable no-console */
/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');
const DevGatekeeper = artifacts.require('TimeTravelingGatekeeper');


const { abiEncode } = require('../utils');

// eslint-disable-next-line func-names
module.exports = async function (deployer, networks) {
  const { gatekeeper: config } = global.panvalaConfig;
  const { firstEpochStart } = config;

  const firstEpochTime = new Date(firstEpochStart);
  const startTime = Math.floor(firstEpochTime / 1000);
  // console.log(startTime);

  const parameters = await ParameterStore.deployed();

  console.log(`Deploying Gatekeeper with ParameterStore ${parameters.address}`);

  // Enable time travel on development networks
  // eslint-disable-next-line operator-linebreak
  const GatekeeperArtifact =
    networks === 'development' || networks === 'ganache' ? DevGatekeeper : Gatekeeper;

  const gatekeeper = await deployer.deploy(GatekeeperArtifact, startTime, parameters.address);
  await parameters.setInitialValue(
    'gatekeeperAddress',
    abiEncode('address', gatekeeper.address),
  );
};
