/* eslint-env mocha */
/* global assert artifacts contract */

const TokenCapacitor = artifacts.require('TokenCapacitor');
const Token = artifacts.require('BasicToken');
const ParameterStore = artifacts.require('ParameterStore');
const launchLptc = require('../scripts/launch_partners_token_capacitor');
const utils = require('./utils');

const { toPanBase } = utils;

contract('TokenCapacitor (Launch Partners)', (accounts) => {
  const [creator] = accounts;
  let parameters;
  let token;
  let snapshotID;
  const baseInitialBalance = toPanBase('10000000');
  const baseInitialUnlockedBalance = toPanBase('10000000');

  beforeEach(async () => {
    snapshotID = await utils.evm.snapshot();
    // use the deployed token and param store
    token = await Token.deployed();
    parameters = await ParameterStore.deployed();
  });

  afterEach(async () => utils.evm.revert(snapshotID));

  it('should correctly initialize both capacitors', async () => {
    // deploy a new launch partners token capacitor
    const launchedLptc = await launchLptc();
    const lptc = await TokenCapacitor.at(launchedLptc.address);

    // charge the newly deployed lptc
    console.log(`Charging lptc with ${baseInitialBalance} tokens`);
    await token.transfer(lptc.address, baseInitialBalance, { from: creator });
    await lptc.updateBalances();

    // verify balance
    const lptcBalance = await token.balanceOf(lptc.address);
    assert.strictEqual(
      lptcBalance.toString(),
      baseInitialUnlockedBalance.toString(),
      'Wrong balance',
    );

    // ParameterStore was connected
    const connectedParameterStore = await lptc.parameters();
    assert.strictEqual(connectedParameterStore, parameters.address);

    // no proposals yet
    const proposalCount = await lptc.proposalCount();
    assert.strictEqual(proposalCount.toString(), '0', 'There should be no proposals yet');

    // check token balances
    const { unlocked, locked } = await utils.capacitorBalances(lptc);
    assert.strictEqual(unlocked.toString(), baseInitialUnlockedBalance.toString(), 'Wrong unlocked');
    assert.strictEqual(locked.toString(), '0', 'Wrong locked');

    const now = await utils.evm.timestamp();
    const lastLockedTime = await lptc.lastLockedTime();
    assert.strictEqual(lastLockedTime.toString(), now.toString(), 'Wrong last locked');

    const releasedTokens = await lptc.lifetimeReleasedTokens();
    assert.strictEqual(releasedTokens.toString(), '0', 'Wrong released');
  });
});
