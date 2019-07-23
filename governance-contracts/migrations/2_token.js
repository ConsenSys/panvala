/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* globals artifacts assert */
const fs = require('fs');

const BasicToken = artifacts.require('BasicToken');

const { BN, isValidAddress } = require('ethereumjs-util');
const { parseUnits } = require('ethers').utils;


function ensure(statement, msg) {
  if (!statement) {
    throw new Error(msg);
  }
}

async function validateConfig(config) {
  const { token, capacitor } = config;

  // Cannot charge with more than the token supply
  if (token.deploy && capacitor.charge) {
    const supply = new BN(token.supply);
    const initialCapacitorBalance = new BN(capacitor.initialBalance);
    ensure(
      supply.gte(initialCapacitorBalance),
      'Initial capacitor balance cannot be greater than the total supply',
    );
  } else {
    ensure(isValidAddress(token.address), `Invalid token address ${token.address}`);
  }

  // If we are not deploying a token, then the deployed token should have the same parameters
  if (!token.deploy) {
    const { decimals, supply } = token;
    const deployed = await BasicToken.at(token.address);

    const deployedDecimals = await deployed.decimals();
    assert.strictEqual(
      deployedDecimals.toString(),
      decimals.toString(),
      'Deployed token decimals does not match config',
    );

    const deployedSupply = await deployed.totalSupply();
    const baseSupply = parseUnits(supply, decimals);
    assert.strictEqual(
      deployedSupply.toString(),
      baseSupply.toString(),
      'Deployed token supply does not match config',
    );
  }
}

// eslint-disable-next-line func-names
module.exports = async function (deployer, network) {
  // Read config and save for later
  const configFile = fs.readFileSync('./conf/config.json');
  const config = JSON.parse(configFile);
  await validateConfig(config);

  global.panvalaConfig = config;
  // console.log(config);

  const devNetworks = ['coverage'];
  const isDev = devNetworks.indexOf(network) !== -1;

  // Do not deploy a token on the dev networks
  if (isDev) {
    // console.log('skipping deployment');
  } else {
    const { token } = config;
    const {
      name, symbol, decimals, supply: formattedTokens,
    } = token;

    // remove commas and convert to base units
    const totalTokens = formattedTokens.replace(/,/g, '');
    const supply = parseUnits(totalTokens, decimals);

    const tokenAddress = token.deploy ? '' : token.address;
    if (!token.deploy) {
      console.log(`Using token at ${tokenAddress}`);
    } else {
      return deployer.deploy(BasicToken, name, symbol, decimals, supply);
    }
  }
};
