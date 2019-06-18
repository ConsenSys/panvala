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


const epochDays = epochs => timing.EPOCH_LENGTH.muln(epochs).div(timing.ONE_DAY);

function lockedTokens(multipliers, scale, days) {
  const initialBalance = new BN(50000000);
  const mul = multipliers[days];
  const locked = initialBalance.mul(new BN(mul)).div(scale);
  return locked;
}

contract('integration', (accounts) => {
  const multipliers = loadDecayMultipliers();

  describe('withdraw over time', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    const initialTokens = '100000000';
    let GRANT;
    let scale;
    let snapshotID;

    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      snapshotID = await utils.evm.snapshot();
      await utils.chargeCapacitor(capacitor, '50000000', token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      scale = await capacitor.scale();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('grant', async () => {
      const initialBalance = new BN(50000000);

      let requestID;
      let slateID;
      const zero = new BN(0);
      let totalRedeemed = zero;

      const runEpoch = async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        // console.log('epoch', epochNumber.toString());

        // get the locked balance for the start of the next epoch
        const d = epochDays(epochNumber.addn(1).toNumber());
        const lockedBalance = lockedTokens(multipliers, scale, d);

        // Create a grant slate for all the tokens
        // Calculate the number of tokens to request
        const futureUnlocked = initialBalance.sub(lockedBalance);
        const tokens = futureUnlocked.sub(totalRedeemed);
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

        await capacitor.withdrawTokens(requestID);
        totalRedeemed = await capacitor.lifetimeReleasedTokens();
        // console.log('withdraw', tokens.toString());

        // const { unlocked, locked } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances', {
        //   unlocked: unlocked.toString(),
        //   locked: locked.toString(),
        // });
        // console.log('checksum', totalRedeemed.add(locked).add(unlocked).toString());

        // console.log('');
      };

      await runEpoch(0);
      await runEpoch(1);
      await runEpoch(2);
      await runEpoch(3);
      await runEpoch(4);
      await runEpoch(5);
      await runEpoch(5);
      await runEpoch(6);
      await runEpoch(7);
      await runEpoch(8);
      await runEpoch(9);

      await runEpoch(10);
      await runEpoch(11);
      await runEpoch(12);
      await runEpoch(13);
      await runEpoch(14);
      await runEpoch(15);
      await runEpoch(16);
      await runEpoch(17);
      await runEpoch(18);
      await runEpoch(19);

      await runEpoch(20);
      await runEpoch(21);
      await runEpoch(22);
      await runEpoch(23);
      await runEpoch(24);
      await runEpoch(25);
      await runEpoch(26);
      await runEpoch(27);
      await runEpoch(28);
      await runEpoch(29);

      await runEpoch(30);
      await runEpoch(31);
      await runEpoch(32);
      await runEpoch(33);
      await runEpoch(34);
      await runEpoch(35);
      await runEpoch(36);
      await runEpoch(37);
      await runEpoch(38);
      await runEpoch(39);
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });
});
