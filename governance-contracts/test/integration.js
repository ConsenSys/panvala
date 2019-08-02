/* eslint-env mocha */
/* global assert contract artifacts */

const utils = require('./utils');

const Gatekeeper = artifacts.require('Gatekeeper');
const UpgradedGatekeeper = artifacts.require('UpgradedGatekeeper');


const {
  grantSlateFromProposals,
  BN,
  timing,
  loadDecayMultipliers,
  createMultihash,
  getResource,
  expectRevert,
  expectErrorLike,
  ContestStatus,
  toPanBase,
  epochPeriods,
} = utils;

const { increaseTime, goToPeriod } = utils.evm;
const { defaultParams } = utils.pan;

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
  let snapshotID;

  beforeEach(async () => {
    snapshotID = await utils.evm.snapshot();
  });

  afterEach(async () => utils.evm.revert(snapshotID));


  describe('withdraw over time', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    let GRANT;
    let scale;
    const initialBalance = new BN(toPanBase(50e6));
    const zero = new BN(0);
    const tokenReleases = utils.loadTokenReleases();
    const daysPerEpoch = 91;

    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ from: creator }));
      await utils.chargeCapacitor(capacitor, 50e6, token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      scale = await capacitor.SCALE();

      // Make sure the recommender has tokens
      const recommenderTokens = toPanBase('50000000');
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should calculate withdrawals correctly each epoch with quarterly balance updates', async () => {
      let requestID;
      let slateID;
      let totalRedeemed = zero;

      const runEpoch = async (n) => {
        const epochNumber = new BN(n);
        const epoch = await gatekeeper.currentEpochNumber();
        // console.log('epoch', epochNumber);
        assert.strictEqual(epochNumber.toString(), epoch.toString(), 'Wrong epoch');

        // calculate the locked balance for the start of the next epoch
        // decay from lastLockedBalance
        const nextEpoch = epochNumber.addn(1);
        const lastLockedBalance = await capacitor.lastLockedBalance();
        const futureLockedBalance = lockedTokens(
          multipliers,
          scale,
          lastLockedBalance,
          daysPerEpoch.toString(),
        );

        // Create a grant slate for all the tokens
        // Calculate the number of tokens to request
        const baseTokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        const tokens = utils.fromPanBase(baseTokens);
        const expectedRelease = new BN(tokenReleases.quarterly[nextEpoch.toString()]);
        // NOTE: should be accurate to the nearest token
        assert.strictEqual(
          Math.floor(tokens),
          Math.floor(utils.fromPanBase(expectedRelease)),
          `Wrong release for epoch ${epochNumber.toString()}`,
        );
        // console.log(`requesting ${tokens} tokens`);

        await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
        const grantProposals = [{
          to: recommender, tokens: baseTokens, metadataHash: createMultihash('grant'), convertTokens: false,
        }];

        slateID = await gatekeeper.slateCount();
        requestID = await gatekeeper.requestCount();
        await grantSlateFromProposals({
          gatekeeper,
          proposals: grantProposals,
          capacitor,
          recommender,
          metadata: createMultihash('my slate'),
          convertTokens: false,
        });
        await gatekeeper.stakeTokens(slateID, { from: recommender });

        // go to the next epoch and finalize
        await goToPeriod(gatekeeper, epochPeriods.REVEAL);
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);
        assert.strictEqual(
          (await gatekeeper.currentEpochNumber()).toString(),
          nextEpoch.toString(),
        );
        await gatekeeper.finalizeContest(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        // console.log('withdraw', tokens.toString(), epochNumber.toString());
        await capacitor.withdrawTokens(requestID, { from: recommender });

        totalRedeemed = await capacitor.lifetimeReleasedTokens();

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
    });

    it('should calculate withdrawals correctly each epoch with daily balance updates', async () => {
      let requestID;
      let slateID;
      let totalRedeemed = zero;

      const runEpoch = async (n) => {
        const epochNumber = new BN(n);
        const epoch = await gatekeeper.currentEpochNumber();
        // console.log('epoch', epochNumber);
        assert.strictEqual(epochNumber.toString(), epoch.toString(), 'Wrong epoch');

        // calculate the locked balance for the start of the next epoch
        const nextEpoch = epochNumber.addn(1);

        // decay from lastLockedBalance
        const lastLockedBalance = await capacitor.lastLockedBalance();

        let futureLockedBalance = lastLockedBalance;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < daysPerEpoch; i++) {
          futureLockedBalance = lockedTokens(multipliers, scale, futureLockedBalance, '1');
        }

        // Create a grant slate for all the tokens
        // Calculate the number of tokens to request
        const baseTokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        const tokens = utils.fromPanBase(baseTokens);
        const expectedRelease = tokenReleases.daily[nextEpoch.toString()];
        // NOTE: should be accurate to the nearest token
        assert.strictEqual(
          Math.floor(tokens),
          Math.floor(utils.fromPanBase(expectedRelease)),
          `Wrong release for epoch ${epochNumber.toString()}`,
        );
        // console.log(`requesting ${tokens} tokens`);

        const updateAndMove = () => increaseTime(timing.ONE_DAY)
          .then(() => capacitor.updateBalances());


        // Go forward a week to the submission period, one day at a atime, with updates
        const SUBMISSION_DAYS = 7;
        const initialSteps = utils.range(SUBMISSION_DAYS).map(() => updateAndMove);
        await utils.chain(initialSteps);

        const grantProposals = [{
          to: recommender, tokens: baseTokens, metadataHash: createMultihash('grant'), convertTokens: false,
        }];

        slateID = await gatekeeper.slateCount();
        requestID = await gatekeeper.requestCount();
        await grantSlateFromProposals({
          gatekeeper,
          proposals: grantProposals,
          capacitor,
          recommender,
          metadata: createMultihash('my slate'),
          convertTokens: false,
        });
        await gatekeeper.stakeTokens(slateID, { from: recommender });


        // Go the rest of the way through the epoch (starting from a week in)
        const steps = utils.range(daysPerEpoch - SUBMISSION_DAYS).map(() => updateAndMove);
        await utils.chain(steps);

        assert.strictEqual(
          (await gatekeeper.currentEpochNumber()).toString(),
          nextEpoch.toString(),
          'Should have reached the next epoch',
        );
        await gatekeeper.finalizeContest(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        await capacitor.withdrawTokens(requestID, { from: recommender });
        totalRedeemed = await capacitor.lifetimeReleasedTokens();
        // console.log('withdraw', tokens.toString(), epochNumber.toString());

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

      const numEpochs = 16;
      const epochs = utils.range(numEpochs).map(i => (() => runEpoch(i)));
      await utils.chain(epochs);
    });
  });

  describe('full epoch cycles', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    let parameters;
    let GRANT;
    let GOVERNANCE;
    const initialBalance = new BN(50e6);

    beforeEach(async () => {
      ({
        gatekeeper, token, capacitor, parameters,
      } = await utils.newPanvala({ from: creator }));
      await utils.chargeCapacitor(capacitor, initialBalance, token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      // Make sure the recommender has tokens
      const recommenderTokens = toPanBase('5000000');
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should run an epoch with multiple contests', async () => {
      // ===== EPOCH 0
      const startingEpoch = await gatekeeper.currentEpochNumber();

      // submit slates
      await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
      const key = 'slateStakeAmount';
      const value = '6000';
      const proposals = [{
        key,
        value: utils.abiEncode('uint256', value),
        metadataHash: utils.createMultihash('Smarter and faster gatekeeper'),
      }];

      const governancePermissions = await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals,
        parameterStore: parameters,
        recommender,
        metadata: utils.createMultihash('Important governance'),
      });
      await gatekeeper.stakeTokens(0, { from: recommender });

      const tokens = '1000';
      const grantProposals = [{
        to: recommender, tokens, metadataHash: utils.createMultihash('grant'),
      }];
      const grantPermissions = await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: utils.createMultihash('Important grant'),
      });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // move forward
      const offset = timing.EPOCH_LENGTH;
      await increaseTime(offset);

      // ===== EPOCH 1
      const secondEpoch = await gatekeeper.currentEpochNumber();
      assert.strictEqual(secondEpoch.toString(), startingEpoch.addn(1).toString(), 'Not in the next epoch');

      // Finalize for both resources
      await gatekeeper.finalizeContest(startingEpoch, GRANT);
      await gatekeeper.finalizeContest(startingEpoch, GOVERNANCE);

      // Execute the proposals
      const originalBalance = await token.balanceOf(recommender);
      await Promise.all(governancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(grantPermissions.map(r => capacitor.withdrawTokens(r)));

      const newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN(toPanBase(tokens))).toString(), 'Tokens not sent');

      const setValue = await parameters.getAsUint(key);
      assert.strictEqual(setValue.toString(), value, 'Stake amount not updated');
    });

    it('should do a "clean break" upgrade of the gatekeeper', async () => {
      // ===== EPOCH 0
      const startingEpoch = await gatekeeper.currentEpochNumber();

      // deploy new gatekeeper with the same starting time as the old one
      const systemStart = await gatekeeper.startTime();
      const newGatekeeper = await Gatekeeper.new(systemStart, parameters.address, token.address, {
        from: creator,
      });

      // create a slate with proposal to change the `gatekeeperAddress` parameter
      await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
      const gatekeeperKey = 'gatekeeperAddress';
      const proposals = [{
        key: gatekeeperKey,
        value: utils.abiEncode('address', newGatekeeper.address),
        metadataHash: utils.createMultihash('Smarter and faster gatekeeper'),
      }];

      const governancePermissions = await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals,
        parameterStore: parameters,
        recommender,
        metadata: utils.createMultihash('Important governance'),
      });
      await gatekeeper.stakeTokens(0, { from: recommender });

      // create a grant slate as well
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
      }];
      const grantPermissions = await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: utils.createMultihash('Important grant'),
      });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // let it go through
      const offset = timing.EPOCH_LENGTH;
      await increaseTime(offset);

      // ===== EPOCH 1
      const secondEpoch = await gatekeeper.currentEpochNumber();
      assert.strictEqual(secondEpoch.toString(), startingEpoch.addn(1).toString(), 'Not second epoch');

      // Finalize for both resources
      await gatekeeper.finalizeContest(startingEpoch, GRANT);
      await gatekeeper.finalizeContest(startingEpoch, GOVERNANCE);

      // Execute the proposals
      let originalBalance = await token.balanceOf(recommender);
      await Promise.all(governancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(grantPermissions.map(r => capacitor.withdrawTokens(r)));

      let newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN(toPanBase('1000'))).toString(), 'Tokens not sent');

      const setGatekeeper = await parameters.getAsAddress(gatekeeperKey);
      assert.strictEqual(setGatekeeper, newGatekeeper.address, 'Gatekeeper not updated');

      // --- work with the new gatekeeper
      const recommenderTokens = await token.balanceOf(recommender);
      await token.approve(newGatekeeper.address, recommenderTokens, { from: recommender });

      // create a grant slate and a governance slate
      await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
      const oldGatekeeperRequestCount = await gatekeeper.requestCount();
      const newGatekeeperRequestCount = await newGatekeeper.requestCount();

      const nextGovernanceProposals = [{
        key: 'slateStakeAmount',
        value: utils.abiEncode('uint256', '6000'),
        metadataHash: utils.createMultihash('Increase stake amount'),
      }];

      const nextGovernancePermissions = await utils.governanceSlateFromProposals({
        gatekeeper: newGatekeeper,
        proposals: nextGovernanceProposals,
        parameterStore: parameters,
        recommender,
        metadata: utils.createMultihash('Another governance'),
      });
      await newGatekeeper.stakeTokens(0, { from: recommender });

      // create a grant slate as well
      const nextGrantProposals = [{
        to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
      }];
      const nextGrantPermissions = await utils.grantSlateFromProposals({
        gatekeeper: newGatekeeper,
        proposals: nextGrantProposals,
        capacitor,
        recommender,
        metadata: utils.createMultihash('Important grant'),
      });
      await newGatekeeper.stakeTokens(1, { from: recommender });

      // Should be the second proposal in each of these contracts
      assert.deepStrictEqual(nextGovernancePermissions.map(r => r.toString()), ['1']);
      assert.deepStrictEqual(nextGrantPermissions.map(r => r.toString()), ['1']);

      // verify that no more requests were created in the old one
      assert.strictEqual(
        (await gatekeeper.requestCount()).toString(),
        oldGatekeeperRequestCount.toString(),
        'Created requests in old gatekeeper',
      );

      // verify that requests get generated in the new gatekeeper
      assert.strictEqual(
        (await newGatekeeper.requestCount()).toString(),
        newGatekeeperRequestCount.addn(2).toString(),
        'Did not create requests in new gatekeeper',
      );

      // finalize and execute for this epoch
      await increaseTime(timing.EPOCH_LENGTH);

      // ===== EPOCH 2
      const thirdEpoch = await gatekeeper.currentEpochNumber();
      assert.strictEqual(thirdEpoch.toString(), startingEpoch.addn(2).toString(), 'Not third epoch');

      await newGatekeeper.finalizeContest(secondEpoch, GRANT);
      await newGatekeeper.finalizeContest(secondEpoch, GOVERNANCE);

      originalBalance = await token.balanceOf(recommender);
      await Promise.all(nextGovernancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(nextGrantPermissions.map(r => capacitor.withdrawTokens(r)));

      newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN(toPanBase('1000'))).toString(), 'Tokens not sent');

      const setStakeAmount = await parameters.getAsUint('slateStakeAmount');
      assert.strictEqual(setStakeAmount.toString(), '6000', 'Stake amount not updated');
    });

    describe('migrate existing state', () => {
      let newGatekeeper;
      let transferEpoch;
      let govWinner;
      let grantWinner;
      let oldGovernancePermissions;
      const gatekeeperKey = 'gatekeeperAddress';

      // go through upgrade up until point before governance proposal execution
      beforeEach(async () => {
        // ===== EPOCH 0
        const startingEpoch = await gatekeeper.currentEpochNumber();
        await token.approve(gatekeeper.address, toPanBase('100000'), { from: creator });

        // deploy newer and shinier gatekeeper
        newGatekeeper = await UpgradedGatekeeper.new(parameters.address, token.address, {
          from: creator,
        });

        // create a slate with proposal to change the `gatekeeperAddress` parameter
        await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
        const proposals = [{
          key: gatekeeperKey,
          value: utils.abiEncode('address', newGatekeeper.address),
          metadataHash: utils.createMultihash('Smarter and faster gatekeeper'),
        }];

        oldGovernancePermissions = await utils.governanceSlateFromProposals({
          gatekeeper,
          proposals,
          parameterStore: parameters,
          recommender,
          metadata: utils.createMultihash('Important governance'),
        });
        await gatekeeper.stakeTokens(0, { from: recommender });

        // create some grant slates as well
        const grantProposals = [{
          to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
        }];
        const grantPermissions = await utils.grantSlateFromProposals({
          gatekeeper,
          proposals: grantProposals,
          capacitor,
          recommender,
          metadata: utils.createMultihash('Important grant'),
        });
        await gatekeeper.stakeTokens(1, { from: recommender });

        // add a competing slate
        const losingProposal = [{
          to: creator, tokens: '10000000', metadataHash: utils.createMultihash('large grant'),
        }];
        await utils.grantSlateFromProposals({
          gatekeeper,
          proposals: losingProposal,
          capacitor,
          recommender: creator,
          metadata: utils.createMultihash('Large grant'),
        });
        await gatekeeper.stakeTokens(2, { from: creator });

        // Run vote for grant slates
        await goToPeriod(gatekeeper, epochPeriods.COMMIT);

        // slate 1 wins
        const aReveal = await utils.voteSingle(gatekeeper, creator, GRANT, 2, 1, '1000', '1234');
        const bReveal = await utils.voteSingle(gatekeeper, recommender, GRANT, 1, 2, '1001', '5678');

        // Reveal all votes
        await increaseTime(timing.COMMIT_PERIOD_LENGTH);
        await utils.revealVote(startingEpoch, gatekeeper, aReveal);
        await utils.revealVote(startingEpoch, gatekeeper, bReveal);

        // Advance past reveal period
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);

        // ===== EPOCH 1
        const secondEpoch = await gatekeeper.currentEpochNumber();
        assert.strictEqual(secondEpoch.toString(), startingEpoch.addn(1).toString(), 'Not second epoch');

        // Finalize for both resources
        const grantReceipt = await gatekeeper.finalizeContest(startingEpoch, GRANT);
        utils.expectEvents(grantReceipt, ['VoteFinalized']);
        ({
          winningSlate: grantWinner,
        } = grantReceipt.logs[0].args);
        assert.strictEqual(grantWinner.toString(), '1', 'Wrong grant winner');

        const govReceipt = await gatekeeper.finalizeContest(startingEpoch, GOVERNANCE);
        utils.expectEvents(govReceipt, ['ContestAutomaticallyFinalized']);
        ({
          winningSlate: govWinner,
        } = govReceipt.logs[0].args);
        assert.strictEqual(govWinner.toString(), '0', 'Wrong governance winner');

        // Execute the grant proposals
        const originalBalance = await token.balanceOf(recommender);
        await utils.pMap(p => capacitor.withdrawTokens(p), grantPermissions);

        const newBalance = await token.balanceOf(recommender);
        assert.strictEqual(
          newBalance.toString(),
          originalBalance.add(new BN(toPanBase('1000'))).toString(),
          'Tokens not sent',
        );

        transferEpoch = startingEpoch;
      });

      it('should not allow initialization before the new gatekeeper has been accepted', async () => {
        const storedGatekeeper = await parameters.getAsAddress(gatekeeperKey);
        assert(storedGatekeeper !== newGatekeeper.address, 'Wrong gatekeeper address');

        try {
          await newGatekeeper.init({ from: creator });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'Not ready');
          return;
        }
        assert.fail('Allowed initialization before gatekeeper was accepted');
      });

      describe('with upgrade accepted', () => {
        beforeEach(async () => {
          // Execute the governance proposals
          utils.pMap(p => parameters.setValue(p), oldGovernancePermissions);
          const setGatekeeper = await parameters.getAsAddress(gatekeeperKey);
          assert.strictEqual(setGatekeeper, newGatekeeper.address, 'Gatekeeper not updated');
        });

        it('should do an upgrade of the gatekeeper while migrating existing state', async () => {
          // migrate state
          await newGatekeeper.init({ from: creator });

          // check state
          const epochNumber = await newGatekeeper.currentEpochNumber();

          assert.strictEqual(
            epochNumber.toString(),
            (await gatekeeper.currentEpochNumber()).toString(),
            'Should have the same epoch number as the old gatekeeper',
          );

          // start time
          const [startTime, expectedStartTime] = await Promise.all([
            newGatekeeper.startTime(),
            gatekeeper.startTime(),
          ]);

          // request count
          const requestCount = await newGatekeeper.requestCount();
          const expectedRequestCount = await gatekeeper.requestCount();
          assert.strictEqual(requestCount.toString(), expectedRequestCount.toString(), 'Request count');

          // slate count
          const slateCount = await newGatekeeper.slateCount();
          const expectedSlateCount = await gatekeeper.slateCount();
          assert.strictEqual(slateCount.toString(), expectedSlateCount.toString(), 'Slate count');
          assert.strictEqual(startTime.toString(), expectedStartTime.toString(), 'Wrong start time');

          // Check transferred data for each contest
          const checkResource = async (contest) => {
            const { resource, name, winner: expectedWinner } = contest;
            // console.log('RESOURCE', name);

            // contests
            const transferredContest = await newGatekeeper.contestDetails(transferEpoch, resource);
            const expectedContest = await gatekeeper.contestDetails(transferEpoch, resource);
            // assert.deepStrictEqual(
            //   transferredContest,
            //   expectedContest,
            //   `${name} contest should have been transferred`
            // );

            // console.log(expectedContest);
            assert.strictEqual(
              transferredContest.status.toString(),
              ContestStatus.Finalized,
              `${name} contest should have been finalized`,
            );

            // winning slates from the transferred epoch
            const winner = await newGatekeeper.getWinningSlate(transferEpoch, resource);
            assert.strictEqual(winner.toString(), expectedWinner.toString(), `Winner does not match old gatekeeper for ${name}`);
            assert.strictEqual(winner.toString(), expectedContest.winner.toString(), `Winner does not match stored for ${name}`);

            // Check requests in the winning slate
            const acceptedRequestIDs = await newGatekeeper.slateRequests(winner);
            assert(acceptedRequestIDs.length > 0);
            const expectedRequestIDs = await gatekeeper.slateRequests(winner);
            assert.deepStrictEqual(acceptedRequestIDs, expectedRequestIDs, 'Wrong accepted requests');

            // Check that all the fields got transferred
            const requests = utils.pMap(r => newGatekeeper.requests(r), acceptedRequestIDs);
            const expectedRequests = utils.pMap(r => gatekeeper.requests(r), acceptedRequestIDs);

            for (let i = 0; i < requests.length; i += 1) {
              const r = requests[i];
              const e = expectedRequests[i];

              assert(r.approved, 'All requests should have been approved');
              assert.strictEqual(r.metadataHash, e.metadataHash, 'Wrong metadata hash');
              assert.strictEqual(r.resource, e.resource, 'Wrong resource');
              assert.strictEqual(r.approved, e.approved, 'Approved is wrong');
              assert.strictEqual(r.expirationTime.toString(), e.expirationTime.toString(), 'Wrong expiration');
            }

            // incumbent
            const incumbent = await newGatekeeper.incumbent(resource);
            const expectedIncumbent = await gatekeeper.incumbent(resource);
            assert.strictEqual(incumbent.toString(), expectedIncumbent.toString(), `Wrong incumbent for ${name}`);
          };

          const resources = [
            { resource: GRANT, name: 'GRANT', winner: grantWinner },
            { resource: GOVERNANCE, name: 'GOVERNANCE', winner: govWinner },
          ];
          await Promise.all([checkResource(resources[0]), checkResource(resources[1])]);

          // use the new gatekeeper
          const recommenderTokens = await token.balanceOf(recommender);
          await token.approve(newGatekeeper.address, recommenderTokens, { from: recommender });

          const oldGatekeeperRequestCount = await gatekeeper.requestCount();
          const newGatekeeperRequestCount = await newGatekeeper.requestCount();

          // create a grant slate and a governance slate
          await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
          let slateID = slateCount.toNumber();

          const governanceProposals = [{
            key: 'slateStakeAmount',
            value: utils.abiEncode('uint256', '6000'),
            metadataHash: utils.createMultihash('Increase stake amount'),
          }];

          const governancePermissions = await utils.governanceSlateFromProposals({
            gatekeeper: newGatekeeper,
            proposals: governanceProposals,
            parameterStore: parameters,
            recommender,
            metadata: utils.createMultihash('Another governance'),
          });
          await newGatekeeper.stakeTokens(slateID, { from: recommender });

          // create a grant slate as well
          const grantProposals = [{
            to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
          }];
          const grantPermissions = await utils.grantSlateFromProposals({
            gatekeeper: newGatekeeper,
            proposals: grantProposals,
            capacitor,
            recommender,
            metadata: utils.createMultihash('Important grant'),
          });
          slateID += 1;
          await newGatekeeper.stakeTokens(slateID, { from: recommender });

          // capacitor has 2 proposals so far, parameter store has 1
          assert.deepStrictEqual(governancePermissions.map(p => p.toString()), ['1']);
          assert.deepStrictEqual(grantPermissions.map(p => p.toString()), ['2']);

          // verify that no more requests were created in the old one
          assert.strictEqual(
            (await gatekeeper.requestCount()).toString(),
            oldGatekeeperRequestCount.toString(),
            'Created requests in old gatekeeper',
          );

          // verify that requests get generated in the new gatekeeper
          assert.strictEqual(
            (await newGatekeeper.requestCount()).toString(),
            newGatekeeperRequestCount.addn(2).toString(),
            'Did not create requests in new gatekeeper',
          );

          // finalize and execute for this epoch
          await increaseTime(timing.EPOCH_LENGTH);

          // ===== EPOCH 2
          const nextEpoch = await gatekeeper.currentEpochNumber();
          assert.strictEqual(nextEpoch.toString(), epochNumber.addn(1).toString(), 'Not next epoch');

          await newGatekeeper.finalizeContest(epochNumber, GRANT);
          await newGatekeeper.finalizeContest(epochNumber, GOVERNANCE);

          const originalBalance = await token.balanceOf(recommender);
          utils.pMap(p => parameters.setValue(p), governancePermissions);
          utils.pMap(p => capacitor.withdrawTokens(p), grantPermissions);

          const newBalance = await token.balanceOf(recommender);
          assert.strictEqual(newBalance.toString(), originalBalance.add(new BN(toPanBase('1000'))).toString(), 'Tokens not sent');

          const setStakeAmount = await parameters.getAsUint('slateStakeAmount');
          assert.strictEqual(setStakeAmount.toString(), '6000', 'Stake amount not updated');

          // Should be able to deposit tokens
          await newGatekeeper.depositVoteTokens(toPanBase('1000'), { from: recommender });
        });

        it('should not allow users to deposit vote tokens before the new gatekeeper has been initialized', async () => {
          try {
            await newGatekeeper.depositVoteTokens('1000', { from: recommender });
          } catch (error) {
            expectRevert(error);
            expectErrorLike(error, 'not initialized');
            return;
          }
          assert.fail('Allowed vote tokens to be deposited before initialization');
        });

        it('should not allow users to stake tokens before the new gatekeeper has been initialized', async () => {
          const slateID = await newGatekeeper.slateCount();

          // recommend slate
          await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
          await utils.grantSlateFromProposals({
            gatekeeper: newGatekeeper,
            proposals: [{
              to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
            }],
            capacitor,
            recommender,
            metadata: utils.createMultihash('Important grant'),
          });

          // try to stake on it
          const recommenderTokens = await token.balanceOf(recommender);
          await token.approve(newGatekeeper.address, recommenderTokens, { from: recommender });

          try {
            await newGatekeeper.stakeTokens(slateID, { from: recommender });
          } catch (error) {
            expectRevert(error);
            expectErrorLike(error, 'not initialized');
            return;
          }
          assert.fail('Allowed a slate to be staked before initialization');
        });
      });
    });
  });

  describe('finalization stress testing', () => {
    const [creator, alice, bob] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    let GRANT;
    const initialBalance = new BN(50e6);
    let epochNumber;

    beforeEach(async () => {
      ({
        gatekeeper, token, capacitor,
      } = await utils.newPanvala({ from: creator }));
      await utils.chargeCapacitor(capacitor, initialBalance, token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      epochNumber = await gatekeeper.currentEpochNumber();

      const voterTokens = toPanBase('100');
      await token.transfer(alice, voterTokens, { from: creator });
      await token.approve(gatekeeper.address, voterTokens, { from: alice });
      await token.transfer(bob, voterTokens, { from: creator });
      await token.approve(gatekeeper.address, voterTokens, { from: bob });
    });

    it('finalizes with a large number of slates', async () => {
      const recommender = creator;
      const balance = await token.balanceOf(recommender);

      // eslint-disable-next-line no-unused-vars
      const stakeAmount = new BN(defaultParams.slateStakeAmount);
      // console.log(stakeAmount.toString(), 'stake amount');

      // Create many slates
      const numSlates = 200;
      // console.log(numSlates, 'num slates');

      // Make sure the recommender has tokens
      await token.approve(gatekeeper.address, balance, { from: recommender });

      // Starting out with no slates
      const slateCount = await gatekeeper.slateCount();
      assert.strictEqual(slateCount.toString(), '0', 'Should be no slates');

      // create `numSlates` slates
      await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
      const createAndStake = async (slateID) => {
        await utils.grantSlateFromProposals({
          gatekeeper,
          proposals: [{
            to: recommender, tokens: '1000', metadataHash: utils.createMultihash('grant'),
          }],
          capacitor,
          recommender,
          metadata: utils.createMultihash('Spam slate'),
        });
        await gatekeeper.stakeTokens(slateID, { from: recommender });
      };

      const slates = utils.range(numSlates);
      await Promise.all(slates.map(createAndStake));

      // vote: slate 1 wins
      await goToPeriod(gatekeeper, epochPeriods.COMMIT);
      const aReveal = await utils.voteSingle(gatekeeper, alice, GRANT, 0, 1, '50', '1234');
      const bReveal = await utils.voteSingle(gatekeeper, bob, GRANT, 1, 0, '100', '5678');
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await utils.revealVote(epochNumber, gatekeeper, aReveal);
      await utils.revealVote(epochNumber, gatekeeper, bReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      const receipt = await gatekeeper.finalizeContest(epochNumber, GRANT);
      utils.expectEvents(receipt, ['VoteFinalized']);
      const contest = await gatekeeper.contestDetails(epochNumber, GRANT);
      const { status, winner } = contest;
      assert.strictEqual(winner.toString(), '1', 'Wrong winning slate');
      assert.strictEqual(status.toString(), ContestStatus.Finalized, 'Not finalized');

      // Check the gas usage for finalization
      const { gasUsed } = receipt.receipt;
      const gasThreshold = 4000000;
      // console.log('GAS USED', gasUsed);
      assert(gasUsed < gasThreshold, `Gas exceeded acceptable threshold of ${gasThreshold}`);

      // The recommender (attacker) has spent at least 10,000,000 PAN
      const finalBalance = await token.balanceOf(recommender);
      const spent = balance.sub(finalBalance);
      // console.log(utils.fromPanBase(spent.toString()), 'tokens spent');

      const tokenThreshold = new BN(toPanBase(10000000));
      assert(spent.gte(tokenThreshold), 'Spent less than the threshold');
    });
  });

  describe('capacitor releases', () => {
    const [creator, recommender, partner] = accounts;

    it('deployment - should allow withdrawal of the correct number of tokens on Nov 1', async () => {
      const initialTokens = 49906303;
      // const initialBalance = new BN(toPanBase(initialTokens));
      // const scale = new BN(1e12);

      // // calculate the decay
      // const decay = (startingBalance, days) => lockedTokens(
      //   multipliers, scale, startingBalance, days.toString(),
      // );

      // // calculate the number of days between two dates
      // const daysBetween = (start, end) => {
      //   const diff = (end - start) / timing.ONE_DAY.toNumber();
      //   return Math.floor(diff);
      // };

      // get a function for printing balances
      const balancePrinter = _capacitor => async (msg) => {
        const { unlocked: u, locked: l } = await utils.capacitorBalances(_capacitor);
        console.log(
          msg || '', 'unlocked',
          utils.fromPanBase(u.toString()),
          'locked',
          utils.fromPanBase(l.toString()),
        );
      };

      // eslint-disable-next-line no-unused-vars
      const printTokens = (base, msg) => {
        console.log(msg || '', base.toString());
      };

      // calculate the decay from system start to launch to determine the unlocked
      // tokens to start with
      const systemStart = utils.dateToTimestamp('2019-08-02 17:00:00Z');
      const launchDay = utils.dateToTimestamp('2019-08-23 17:00:00Z');

      // expected values
      const initialUnlockedBalance = new BN('496443351836365210000000');
      const expectedProjectedUnlocked = new BN('2115863519962730001675795');
      const lockedAtLaunch = new BN('49409859648163634790000000');
      const releasedAfterLaunch = expectedProjectedUnlocked.sub(initialUnlockedBalance);

      // const daysElapsed = daysBetween(systemStart, launchDay);
      // const lockedAtLaunch = decay(initialBalance, daysElapsed);
      // const initialUnlockedBalance = initialBalance.sub(lockedAtLaunch);
      // printTokens(initialUnlockedBalance, 'initial unlocked');

      // Go to launch day and deploy capacitor with initial unlocked balance
      await utils.evm.goTo(new BN(launchDay));
      const {
        gatekeeper, token, capacitor,
      } = await utils.newPanvala({ startTime: systemStart, initialUnlockedBalance, from: creator });
      // eslint-disable-next-line no-unused-vars
      const printBalances = balancePrinter(capacitor);

      await utils.chargeCapacitor(capacitor, initialTokens, token, { from: creator });
      // await printBalances('after launch');

      const unlockedAtLaunch = await capacitor.unlockedBalance();
      assert.strictEqual(
        unlockedAtLaunch.toString(),
        initialUnlockedBalance.toString(),
        'Wrong unlocked',
      );

      const actualLockedAtLaunch = await capacitor.lastLockedBalance();
      assert.strictEqual(
        actualLockedAtLaunch.toString(),
        lockedAtLaunch.toString(),
        'Wrong initial locked',
      );

      const epochNumber = await gatekeeper.currentEpochNumber();

      // withdraw the right amount after epoch end
      // initial unlocked + decay from lockedAtLaunch
      const nextEpochStart = await gatekeeper.epochStart(epochNumber.addn(1));
      const projectedUnlocked = await capacitor.projectedUnlockedBalance(nextEpochStart);
      // printTokens(projectedUnlocked, 'projected unlocked');

      // // check that our calculation matches the projection
      // const lastLockedTime = await capacitor.lastLockedTime();
      // const days = daysBetween(lastLockedTime, nextEpochStart);
      // const lockedAtNextEpoch = decay(lockedAtLaunch, days);
      // const releasedAfterLaunch = lockedAtLaunch.sub(lockedAtNextEpoch);
      // const unlocked = initialUnlockedBalance.add(releasedAfterLaunch);
      // printTokens(lockedAtLaunch, 'locked at launch');
      // printTokens(lockedAtNextEpoch, 'locked at next epoch');
      // printTokens(releasedAfterLaunch, 'released after launch');
      // printTokens(unlocked, 'calculated unlocked');
      assert.strictEqual(
        projectedUnlocked.toString(),
        expectedProjectedUnlocked.toString(),
        'Wrong projected unlocked',
      );

      // Run the epoch: should be able to withdraw more than the amount released after launch
      const GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = toPanBase('100000');
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create a slate
      const amount = projectedUnlocked;
      assert(amount.gt(releasedAfterLaunch), 'Should be requesting more than released after launch');
      const proposalIDs = await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: [{
          to: recommender,
          tokens: amount,
          metadataHash: utils.createMultihash('more than release'),
        }],
        capacitor,
        recommender,
        metadata: utils.createMultihash('Important grant'),
        convertTokens: false,
      });
      await gatekeeper.stakeTokens(0, { from: recommender });

      // Finalize
      await increaseTime(timing.EPOCH_LENGTH);
      await gatekeeper.finalizeContest(epochNumber, GRANT);

      // Withdraw
      const balanceBefore = await token.balanceOf(recommender);
      await capacitor.withdrawTokens(proposalIDs[0], { from: recommender });
      const balanceAfter = await token.balanceOf(recommender);

      assert.strictEqual(
        balanceAfter.toString(),
        balanceBefore.add(amount).toString(),
        'Tokens not withdrawn',
      );
    });

    it('launch partner - should allow withdrawal of all tokens if they are all initially unlocked', async () => {
      const tokens = 10000000;
      const capacitorBalance = toPanBase(tokens);
      const initialUnlockedBalance = capacitorBalance;

      // deploy capacitor, token, with initial amount
      const {
        gatekeeper, token, capacitor,
      } = await utils.newPanvala({ initialUnlockedBalance, from: creator });

      const epochNumber = await gatekeeper.currentEpochNumber();
      const unlocked = await capacitor.unlockedBalance();
      assert.strictEqual(unlocked.toString(), initialUnlockedBalance.toString(), 'Wrong unlocked');
      await utils.chargeCapacitor(capacitor, tokens, token, { from: creator });

      const GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = toPanBase('100000');
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create a slate, dividing up the tokens into two proposals
      await goToPeriod(gatekeeper, epochPeriods.SUBMISSION);
      const amount = tokens / 2;
      const proposalIDs = await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: [{
          to: partner,
          tokens: amount,
          metadataHash: utils.createMultihash('partner tokens'),
        },
        {
          to: partner,
          tokens: amount,
          metadataHash: utils.createMultihash('partner tokens'),
        }],
        capacitor,
        recommender,
        metadata: utils.createMultihash('Important grant'),
      });
      await gatekeeper.stakeTokens(0, { from: recommender });

      // Finalize
      await increaseTime(timing.EPOCH_LENGTH);
      await gatekeeper.finalizeContest(epochNumber, GRANT);

      // Redeem both installments
      const initialPartnerBalance = await token.balanceOf(partner);

      await capacitor.withdrawTokens(proposalIDs[0]);
      await capacitor.withdrawTokens(proposalIDs[1]);

      const partnerBalance = await token.balanceOf(partner);
      const expectedBalance = initialPartnerBalance.add(new BN(capacitorBalance));
      assert.strictEqual(
        partnerBalance.toString(),
        expectedBalance.toString(),
        'Tokens not withdrawn',
      );
    });
  });
});
