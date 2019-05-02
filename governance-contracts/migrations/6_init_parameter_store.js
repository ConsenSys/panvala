/* eslint-disable no-unused-vars */
/* globals artifacts */
const ParameterStore = artifacts.require('ParameterStore');

// eslint-disable-next-line func-names
module.exports = async function (_deployer) {
  const parameters = await ParameterStore.deployed();

  await parameters.init();
};
