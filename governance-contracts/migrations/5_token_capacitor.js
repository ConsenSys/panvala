/* globals artifacts */
const TokenCapacitor = artifacts.require('TokenCapacitor');
const ParameterStore = artifacts.require('ParameterStore');

const { abiEncode } = require('../utils');

// eslint-disable-next-line func-names
module.exports = async function (deployer) {
  const parameters = await ParameterStore.deployed();
  console.log(`Deploying TokenCapacitor with ParameterStore ${parameters.address}`);

  const capacitor = await deployer.deploy(TokenCapacitor, parameters.address);

  await parameters.setInitialValue(
    'tokenCapacitorAddress',
    abiEncode('address', capacitor.address),
  );
};
