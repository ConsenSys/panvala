/* eslint-env mocha */
/* global assert artifacts contract */
const {
  abiCoder, abiEncode, expectErrorLike, expectRevert,
} = require('./utils');

const ParameterStore = artifacts.require('ParameterStore');


contract('ParameterStore', (accounts) => {
  describe('constructor', () => {
    const [creator] = accounts;
    const data = {
      apples: abiEncode('uint256', 2),
      bananas: abiEncode('uint256', 3),
    };
    let names;
    let values;

    beforeEach(() => {
      names = Object.keys(data);
      values = Object.values(data);
    });

    it('should correctly initialize the parameter store', async () => {
      const parameters = await ParameterStore.new(
        names, values,
        { from: creator },
      );

      // get values
      const apples = await parameters.get('apples');
      assert.strictEqual(apples.toString(), data.apples);

      const bananas = await parameters.get('bananas');
      assert.strictEqual(bananas.toString(), data.bananas);
    });

    it('should be okay with no initial values', async () => {
      await ParameterStore.new([], []);
    });
  });

  describe('init', () => {
    const [creator, user] = accounts;
    let parameters;

    beforeEach(async () => {
      // deploy
      parameters = await ParameterStore.new([], [], { from: creator });
    });

    it('should allow the creator to initialize', async () => {
      await parameters.init({ from: creator });
    });

    it('should not allow multiple initializations', async () => {
      await parameters.init({ from: creator });

      try {
        await parameters.init({ from: creator });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed multiple initializations');
    });

    it('should not allow anyone other than the creator to initialize', async () => {
      try {
        await parameters.init({ from: user });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed someone other than the creator to initialize');
    });
  });

  describe('setInitialValue', () => {
    const [creator, user] = accounts;
    let parameters;

    beforeEach(async () => {
      // deploy
      parameters = await ParameterStore.new([], [], { from: creator });
    });

    it('should allow the creator to set initial values', async () => {
      const value = abiEncode('uint256', 5);
      await parameters.setInitialValue('test', value, { from: creator });

      const test = await parameters.get('test');
      assert.strictEqual(test.toString(), value);
    });

    it('should not allow someone other than the creator to set initial values', async () => {
      const value = abiEncode('uint256', 5);

      try {
        await parameters.setInitialValue('test', value, { from: user });
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Allowed someone other than the creator to set initial values');
    });

    it('should not allow the creator to set values after initialization', async () => {
      const value = abiEncode('uint256', 5);
      await parameters.init({ from: creator });

      try {
        await parameters.setInitialValue('test', value, { from: creator });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Cannot set values after initialization');
        return;
      }

      assert.fail('Allowed the creator to set initial values after initialization');
    });
  });

  // get - what about non-existent values
  describe('get', () => {
    const [creator] = accounts;

    describe('asAddress', () => {
      it('should retrieve an address value', async () => {
        const key = 'someAddress';
        const value = abiCoder.encode(['address'], [creator]);
        const parameters = await ParameterStore.new([key], [value]);

        const retrievedValue = await parameters.getAsAddress(key);
        assert.strictEqual(retrievedValue, creator);
      });
    });
  });
});
