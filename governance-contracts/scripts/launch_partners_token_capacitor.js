/* eslint-disable no-console */
/* globals artifacts web3 */
const TokenCapacitor = artifacts.require('TokenCapacitor');
const ParameterStore = artifacts.require('ParameterStore');
const BasicToken = artifacts.require('BasicToken');
const { utils } = require('ethers');
const fs = require('fs');
const path = require('path');

const configFile = path.resolve(__dirname, '../conf/config.json');
const lptcConfigFile = path.resolve(__dirname, '../conf/launch_partners_config.json');
const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
const lptcConfig = JSON.parse(fs.readFileSync(lptcConfigFile, 'utf-8'));

const { prettify } = require('./utils');

// eslint-disable-next-line
async function run(networkID) {
  const accounts = await web3.eth.getAccounts();
  const [creator] = accounts;

  console.log('We are on network', networkID);

  // if running tests, will get the most recently deployed
  // if running truffle script, will get from /build/ParameterStore.json
  const parameters = await ParameterStore.deployed();
  console.log(`Deploying Launch Partners TokenCapacitor with ParameterStore ${parameters.address}`);

  console.log(config);
  console.log(lptcConfig);

  const { decimals, deploy, address: tokenInfoAddress } = config.token;
  const { initialUnlockedBalance } = lptcConfig;

  const token = deploy ? await BasicToken.deployed() : await BasicToken.at(tokenInfoAddress);

  console.log('Using Token:', token.address);

  const baseInitialUnlocked = utils.parseUnits(initialUnlockedBalance, decimals);
  const capacitor = await TokenCapacitor.new(
    parameters.address,
    token.address,
    baseInitialUnlocked,
    { from: creator },
  );
  console.log('LPTC address:', capacitor.address);

  const updatedLptcConfig = {
    ...lptcConfig,
    networks: {
      ...lptcConfig.networks,
      [networkID]: capacitor.address,
    },
  };
  const json = await prettify(updatedLptcConfig);
  fs.writeFileSync(lptcConfigFile, json);

  return capacitor;
}

module.exports = async (done) => {
  const network = await web3.eth.net.getId((err, chainId) => {
    if (err) {
      if (typeof done !== 'undefined') {
        return done(err);
      }
      throw err;
    }
    return chainId;
  });
  return run(network)
    .then((capacitor) => {
      if (capacitor) {
        if (typeof done !== 'undefined') {
          done();
        }
        return capacitor;
      }
      throw new Error('Capacitor failed to deploy');
    })
    .catch(console.error);
};
