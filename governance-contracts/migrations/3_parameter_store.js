/* globals artifacts */
const ParameterStore = artifacts.require('ParameterStore');
const BasicToken = artifacts.require('BasicToken');

const { isValidAddress } = require('ethereumjs-util');
const { abiEncode } = require('../utils');

// eslint-disable-next-line func-names
module.exports = async function (deployer, networks) {
  function info(message) {
    if (networks !== 'development') {
      console.log(message);
    }
  }
  const parameterStoreAddress = '';

  if (isValidAddress(parameterStoreAddress)) {
    info(`Using ParameterStore at ${parameterStoreAddress}`);
  } else {
    const stakeAmount = '5000000000000000000000';
    // TODO: handle token deployed outside of migrations
    const token = await BasicToken.deployed();

    const names = ['slateStakeAmount', 'tokenAddress'];
    const values = [
      abiEncode('uint256', stakeAmount),
      abiEncode('address', token.address),
    ];

    info(names, values);
    await deployer.deploy(ParameterStore, names, values);
  }
};
