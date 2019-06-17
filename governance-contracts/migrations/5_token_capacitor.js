/* eslint-disable no-console */
/* globals artifacts */
const TokenCapacitor = artifacts.require('TokenCapacitor');
const ParameterStore = artifacts.require('ParameterStore');
const BasicToken = artifacts.require('BasicToken');

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

  // Charge the capacitor
  const { capacitor: config, token: tokenInfo } = global.panvalaConfig;
  const { charge, initialBalance } = config;

  if (charge) {
    console.log(`Charging capacitor with ${initialBalance} tokens`);
    // transfer
    const token = tokenInfo.deploy
      ? await BasicToken.deployed()
      : await BasicToken.at(tokenInfo.address);

    // if the creator has enough balance, then charge
    await token.transfer(capacitor.address, initialBalance);
  }
};
