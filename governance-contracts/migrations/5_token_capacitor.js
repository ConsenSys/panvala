/* eslint-disable no-console */
/* globals artifacts */
const TokenCapacitor = artifacts.require('TokenCapacitor');
const ParameterStore = artifacts.require('ParameterStore');
const BasicToken = artifacts.require('BasicToken');
const { utils } = require('ethers');
const { abiEncode, BN } = require('../utils');

// eslint-disable-next-line
module.exports = async function(deployer, _, accounts) {
  const parameters = await ParameterStore.deployed();
  console.log(`Deploying TokenCapacitor with ParameterStore ${parameters.address}`);

  const { capacitor: config, token: tokenInfo } = global.panvalaConfig;

  const token = tokenInfo.deploy
    ? await BasicToken.deployed()
    : await BasicToken.at(tokenInfo.address);

  const capacitor = await deployer.deploy(TokenCapacitor, parameters.address, token.address);

  await parameters.setInitialValue(
    'tokenCapacitorAddress',
    abiEncode('address', capacitor.address) // eslint-disable-line comma-dangle
  );

  // Charge the capacitor
  const { charge, initialBalance } = config;

  if (charge) {
    console.log(`Charging capacitor with ${initialBalance} tokens`);

    // if the creator has enough balance, then charge
    const [creator] = accounts;
    const balance = await token.balanceOf(creator);
    if (balance.gte(new BN(initialBalance))) {
      const baseUnitsBalance = utils.parseUnits(initialBalance, tokenInfo.decimals);
      await token.transfer(capacitor.address, baseUnitsBalance);
      await capacitor.updateBalances();
    } else {
      throw new Error("You don't have enough tokens to charge the capacitor");
    }
  }
};
