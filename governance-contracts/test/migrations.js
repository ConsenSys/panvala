/* eslint-env mocha */
/* global assert contract artifacts */

const utils = require('./utils');

const Gatekeeper = artifacts.require('Gatekeeper');
const TimeTravelingGatekeeper = artifacts.require('TimeTravelingGatekeeper');
const TokenCapacitor = artifacts.require('TokenCapacitor');
const BasicToken = artifacts.require('BasicToken');

const { toPanBase, asBN } = utils;


contract('migrations', (accounts) => {
  const [creator] = accounts;

  it('should correctly initialize the contracts in the migrations', async () => {
    // read the config file
    const config = utils.loadJSON('conf/config.json');
    const { token: tokenConfig, capacitor: capacitorConfig, gatekeeper: gatekeeperConfig } = config;

    // get the deployed contracts
    let gatekeeper;
    try {
      gatekeeper = await TimeTravelingGatekeeper.deployed();
    } catch (error) {
      console.error(error);
      gatekeeper = await Gatekeeper.deployed();
    }

    const capacitor = await TokenCapacitor.deployed();

    let token;
    // If we didn't deploy a new token, we should use the one in the config
    if (tokenConfig.deploy) {
      token = await BasicToken.deployed();
    } else {
      token = await BasicToken.at(tokenConfig.address);
      assert.strictEqual(token.address, tokenConfig.address, 'Token does not match');
    }

    // token should be connected correctly
    const gkToken = await gatekeeper.token();
    assert.strictEqual(gkToken, token.address, 'Gatekeeper has wrong token');

    const tcToken = await capacitor.token();
    assert.strictEqual(tcToken, token.address, 'TokenCapacitor has wrong token');

    // gatekeeper should have the right start time
    const systemStart = await gatekeeper.startTime();
    const dateMillis = new Date(gatekeeperConfig.firstEpochStart);
    const expectedStart = asBN(Math.floor(dateMillis / 1000));
    assert.strictEqual(systemStart.toString(), expectedStart.toString(), 'Wrong start time');

    // capacitor should have the right balance
    const expectedCapacitorBalance = capacitorConfig.charge
      ? asBN(toPanBase(capacitorConfig.initialBalance))
      : asBN('0');

    const capacitorBalance = await token.balanceOf(capacitor.address);
    assert.strictEqual(
      capacitorBalance.toString(),
      expectedCapacitorBalance.toString(),
      'Wrong capacitor balance',
    );

    // capacitor's unlocked balance should be at least the initial unlocked balance
    const { locked, unlocked } = await utils.capacitorBalances(capacitor);
    const expectedUnlocked = asBN(toPanBase(capacitorConfig.initialUnlockedBalance));
    assert.strictEqual(
      unlocked.toString(),
      expectedUnlocked.toString(),
      'Wrong unlocked balance',
    );

    // unlocked + locked = initialBalance
    assert.strictEqual(
      locked.add(unlocked).toString(),
      expectedCapacitorBalance.toString(),
      'Unlocked and locked balances did not add up',
    );

    // Creator's balance should be correct if we deployed a token
    // (If the token already existed, we can't be sure)
    if (tokenConfig.deploy) {
      const supply = await token.totalSupply();

      const creatorBalance = await token.balanceOf(creator);
      const expectedCreatorBalance = supply.sub(expectedCapacitorBalance);
      assert.strictEqual(
        creatorBalance.toString(),
        expectedCreatorBalance.toString(),
        'Wrong creator balance',
      );
    }
  });
});
