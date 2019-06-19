/* eslint-env mocha */
/* global assert contract */

const utils = require('./utils');


const {
  grantSlateFromProposals,
  BN,
  timing,
  loadDecayMultipliers,
  createMultihash,
  getResource,
} = utils;

const { increaseTime } = utils.evm;

/**
 * Calculate the number of locked tokens
 * @param {Object} multipliers
 * @param {BN} scale
 * @param {BN} startingBalance
 * @param {string} days
 */
function lockedTokens(multipliers, scale, startingBalance, days) {
  const mul = multipliers[days];
  const locked = startingBalance.mul(new BN(mul)).div(scale);
  return locked;
}

contract('integration', (accounts) => {
  const multipliers = loadDecayMultipliers();

  describe('withdraw over time', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    const initialTokens = new BN(100e6);
    let GRANT;
    let scale;
    let snapshotID;
    const initialBalance = new BN(50e6);
    const zero = new BN(0);

    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      snapshotID = await utils.evm.snapshot();
      await utils.chargeCapacitor(capacitor, initialBalance, token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      scale = await capacitor.scale();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should calculate withdrawals correctly each epoch', async () => {
      let requestID;
      let slateID;
      let totalRedeemed = zero;
      const tokenWithdrawals = [];

      const runEpoch = async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        // console.log('epoch', epochNumber.toString());

        // calculate the locked balance for the start of the next epoch
        const now = await utils.evm.timestamp();
        const nextEpochStart = await gatekeeper.epochStart(epochNumber.addn(1));
        const daysLeft = nextEpochStart.sub(new BN(now)).div(timing.ONE_DAY);
        // console.log(`${daysLeft} days left`);

        // decay from lastLockedBalance
        const lastLockedBalance = await capacitor.lastLockedBalance();
        const futureLockedBalance = lockedTokens(
          multipliers,
          scale,
          lastLockedBalance,
          daysLeft.toString(),
        );
        const projectedLockedBalance = await capacitor.projectedLockedBalance(nextEpochStart);
        assert.strictEqual(
          futureLockedBalance.toString(),
          projectedLockedBalance.toString(),
          `Calculation and projection do not match for epoch ${epochNumber.toString()}`,
        );
        // console.log({
        //   calculated: futureLockedBalance.toString(),
        //   projected: projectedLockedBalance.toString(),
        // });

        // Create a grant slate for all the tokens
        // Calculate the number of tokens to request
        const tokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        // console.log(`requesting ${tokens} tokens`);

        const grantProposals = [{
          to: recommender, tokens, metadataHash: createMultihash('grant'),
        }];

        slateID = await gatekeeper.slateCount();
        requestID = await gatekeeper.requestCount();
        await grantSlateFromProposals({
          gatekeeper,
          proposals: grantProposals,
          capacitor,
          recommender,
          metadata: createMultihash('my slate'),
        });
        await gatekeeper.stakeTokens(slateID, { from: recommender });

        // go to the next epoch and finalize
        await increaseTime(timing.EPOCH_LENGTH);
        assert.strictEqual(
          (await gatekeeper.currentEpochNumber()).toString(),
          epochNumber.addn(1).toString(),
        );
        await gatekeeper.countVotes(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        await capacitor.withdrawTokens(requestID, { from: recommender });
        tokenWithdrawals.push(tokens.toNumber());
        totalRedeemed = await capacitor.lifetimeReleasedTokens();
        // console.log('withdraw', tokens.toString());

        const { unlocked, locked } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances', {
        //   unlocked: unlocked.toString(),
        //   locked: locked.toString(),
        // });

        assert.strictEqual(
          totalRedeemed
            .add(locked)
            .add(unlocked)
            .toString(),
          initialBalance.toString(),
          `Checksum failed for epoch ${epochNumber.toString()}`,
        );
      };

      const numEpochs = 40;
      const epochs = utils.range(numEpochs).map(i => (() => runEpoch(i)));
      await utils.chain(epochs);

      // console.log(tokenWithdrawals);
    });

    it('should calculate withdrawals correctly with daily balance updates', async () => {
      let requestID;
      let slateID;
      let totalRedeemed = zero;
      const tokenWithdrawals = [];

      const runEpoch = async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        // console.log('epoch', epochNumber.toString());

        // calculate the locked balance for the start of the next epoch
        const now = await utils.evm.timestamp();
        const nextEpochStart = await gatekeeper.epochStart(epochNumber.addn(1));
        const daysLeft = nextEpochStart.sub(new BN(now)).div(timing.ONE_DAY);
        // console.log(`${daysLeft} days left`);

        // decay from lastLockedBalance
        const lastLockedBalance = await capacitor.lastLockedBalance();
        const futureLockedBalance = lockedTokens(
          multipliers,
          scale,
          lastLockedBalance,
          daysLeft.toString(),
        );
        const projectedLockedBalance = await capacitor.projectedLockedBalance(nextEpochStart);
        assert.strictEqual(
          futureLockedBalance.toString(),
          projectedLockedBalance.toString(),
          `Calculation and projection do not match for epoch ${epochNumber.toString()}`,
        );
        // console.log({
        //   calculated: futureLockedBalance.toString(),
        //   projected: projectedLockedBalance.toString(),
        // });

        // Create a grant slate for all the tokens
        // Calculate the number of tokens to request
        const tokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        // console.log(`requesting ${tokens} tokens`);

        const grantProposals = [{
          to: recommender, tokens, metadataHash: createMultihash('grant'),
        }];

        slateID = await gatekeeper.slateCount();
        requestID = await gatekeeper.requestCount();
        await grantSlateFromProposals({
          gatekeeper,
          proposals: grantProposals,
          capacitor,
          recommender,
          metadata: createMultihash('my slate'),
        });
        await gatekeeper.stakeTokens(slateID, { from: recommender });

        // go to the next epoch and finalize
        // go forward one day at a time to the next epoch and call updateBalances
        const updateAndMove = () => increaseTime(timing.ONE_DAY)
          .then(() => capacitor.updateBalances());

        const steps = utils.range(daysLeft.addn(1).toNumber()).map(() => updateAndMove);
        await utils.chain(steps);


        assert.strictEqual(
          (await gatekeeper.currentEpochNumber()).toString(),
          epochNumber.addn(1).toString(),
        );
        await gatekeeper.countVotes(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        await capacitor.withdrawTokens(requestID, { from: recommender });
        tokenWithdrawals.push(tokens.toNumber());
        totalRedeemed = await capacitor.lifetimeReleasedTokens();
        // console.log('withdraw', tokens.toString());

        const { unlocked, locked } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances', {
        //   unlocked: unlocked.toString(),
        //   locked: locked.toString(),
        // });

        assert.strictEqual(
          totalRedeemed
            .add(locked)
            .add(unlocked)
            .toString(),
          initialBalance.toString(),
          `Checksum failed for epoch ${epochNumber.toString()}`,
        );
      };

      await capacitor.updateBalances();
      const numEpochs = 4;
      const epochs = utils.range(numEpochs).map(i => (() => runEpoch(i)));
      await utils.chain(epochs);

      // console.log(tokenWithdrawals);
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });
});
