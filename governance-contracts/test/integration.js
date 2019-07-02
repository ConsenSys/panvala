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
    const tokenReleases = utils.loadTokenReleases();
    const daysPerEpoch = 91;

    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      snapshotID = await utils.evm.snapshot();
      await utils.chargeCapacitor(capacitor, initialBalance, token, { from: creator });
      // await token.transfer(capacitor.address, initialBalance, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      scale = await capacitor.scale();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000000';
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
        const tokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        const expectedRelease = tokenReleases.quarterly[nextEpoch.toString()];
        assert.strictEqual(
          tokens.toString(),
          expectedRelease.toString(),
          `Wrong release for epoch ${epochNumber.toString()}`,
        );
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
          nextEpoch.toString(),
        );
        await gatekeeper.countVotes(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        // console.log('withdraw', tokens.toString());
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
        const tokens = initialBalance.sub(totalRedeemed).sub(futureLockedBalance);
        const expectedRelease = tokenReleases.daily[nextEpoch.toString()];
        assert.strictEqual(
          tokens.toString(),
          expectedRelease.toString(),
          `Wrong release for epoch ${epochNumber.toString()}`,
        );
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

        // go forward one day at a time to the next epoch and call updateBalances
        const updateAndMove = () => increaseTime(timing.ONE_DAY)
          .then(() => capacitor.updateBalances());
        const steps = utils.range(daysPerEpoch).map(() => updateAndMove);
        await utils.chain(steps);

        assert.strictEqual(
          (await gatekeeper.currentEpochNumber()).toString(),
          nextEpoch.toString(),
          'Should have reached the next epoch',
        );
        await gatekeeper.countVotes(epochNumber, GRANT);

        // const { unlocked: u, locked: l } = await utils.capacitorBalances(capacitor);
        // console.log('capacitor balances (before withdrawal)', {
        //   unlocked: u.toString(),
        //   locked: l.toString(),
        // });

        await capacitor.withdrawTokens(requestID, { from: recommender });
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

      // await capacitor.updateBalances();
      const numEpochs = 16;
      const epochs = utils.range(numEpochs).map(i => (() => runEpoch(i)));
      await utils.chain(epochs);
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('full epoch cycles', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let capacitor;
    let token;
    let parameters;
    const initialTokens = new BN(100e6);
    let GRANT;
    let GOVERNANCE;
    let snapshotID;
    const initialBalance = new BN(50e6);

    beforeEach(async () => {
      ({
        gatekeeper, token, capacitor, parameters,
      } = await utils.newPanvala({ initialTokens, from: creator }));
      snapshotID = await utils.evm.snapshot();
      await utils.chargeCapacitor(capacitor, initialBalance, token, { from: creator });

      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should run an epoch with multiple contests', async () => {
      // ===== EPOCH 0
      const startingEpoch = await gatekeeper.currentEpochNumber();

      // submit slates
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
      await gatekeeper.countVotes(startingEpoch, GRANT);
      await gatekeeper.countVotes(startingEpoch, GOVERNANCE);

      // Execute the proposals
      const originalBalance = await token.balanceOf(recommender);
      await Promise.all(governancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(grantPermissions.map(r => capacitor.withdrawTokens(r)));

      const newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN(tokens)).toString(), 'Tokens not sent');

      const setValue = await parameters.getAsUint(key);
      assert.strictEqual(setValue.toString(), value, 'Stake amount not updated');
    });

    it('should do a "clean break" upgrade of the gatekeeper', async () => {
      // ===== EPOCH 0
      const startingEpoch = await gatekeeper.currentEpochNumber();

      // deploy new gatekeeper with the same starting time as the old one
      const systemStart = await gatekeeper.startTime();
      const newGatekeeper = await Gatekeeper.new(systemStart, parameters.address, {
        from: creator,
      });

      // create a slate with proposal to change the `gatekeeperAddress` parameter
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
      await gatekeeper.countVotes(startingEpoch, GRANT);
      await gatekeeper.countVotes(startingEpoch, GOVERNANCE);

      // Execute the proposals
      let originalBalance = await token.balanceOf(recommender);
      await Promise.all(governancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(grantPermissions.map(r => capacitor.withdrawTokens(r)));

      let newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN('1000')).toString(), 'Tokens not sent');

      const setGatekeeper = await parameters.getAsAddress(gatekeeperKey);
      assert.strictEqual(setGatekeeper, newGatekeeper.address, 'Gatekeeper not updated');

      // --- work with the new gatekeeper
      const recommenderTokens = await token.balanceOf(recommender);
      await token.approve(newGatekeeper.address, recommenderTokens, { from: recommender });

      // create a grant slate and a governance slate
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

      await newGatekeeper.countVotes(secondEpoch, GRANT);
      await newGatekeeper.countVotes(secondEpoch, GOVERNANCE);

      originalBalance = await token.balanceOf(recommender);
      await Promise.all(nextGovernancePermissions.map(r => parameters.setValue(r)));
      await Promise.all(nextGrantPermissions.map(r => capacitor.withdrawTokens(r)));

      newBalance = await token.balanceOf(recommender);
      assert.strictEqual(newBalance.toString(), originalBalance.add(new BN('1000')).toString(), 'Tokens not sent');

      const setStakeAmount = await parameters.getAsUint('slateStakeAmount');
      assert.strictEqual(setStakeAmount.toString(), '6000', 'Stake amount not updated');
    });

    describe('migrate existing state', () => {
      let newGatekeeper;
      let transferEpoch;
      let govWinner;
      let grantWinner;

      // go through upgrade up until point before initialization
      beforeEach(async () => {
        // ===== EPOCH 0
        const startingEpoch = await gatekeeper.currentEpochNumber();
        await token.approve(gatekeeper.address, '10000', { from: creator });

        // deploy newer and shinier gatekeeper
        newGatekeeper = await UpgradedGatekeeper.new(parameters.address, {
          from: creator,
        });

        // create a slate with proposal to change the `gatekeeperAddress` parameter
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
        await increaseTime(timing.VOTING_PERIOD_START);

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
        const grantReceipt = await gatekeeper.countVotes(startingEpoch, GRANT);
        utils.expectEvents(grantReceipt, ['ConfidenceVoteCounted', 'ConfidenceVoteFinalized']);
        ({
          winningSlate: grantWinner,
        } = grantReceipt.logs[1].args);
        assert.strictEqual(grantWinner.toString(), '1', 'Wrong grant winner');

        const govReceipt = await gatekeeper.countVotes(startingEpoch, GOVERNANCE);
        utils.expectEvents(govReceipt, ['ContestAutomaticallyFinalized']);
        ({
          winningSlate: govWinner,
        } = govReceipt.logs[0].args);
        assert.strictEqual(govWinner.toString(), '0', 'Wrong governance winner');

        // Execute the proposals
        const originalBalance = await token.balanceOf(recommender);
        utils.pMap(p => parameters.setValue(p), governancePermissions);
        utils.pMap(p => capacitor.withdrawTokens(p), grantPermissions);

        const newBalance = await token.balanceOf(recommender);
        assert.strictEqual(newBalance.toString(), originalBalance.add(new BN('1000')).toString(), 'Tokens not sent');

        const setGatekeeper = await parameters.getAsAddress(gatekeeperKey);
        assert.strictEqual(setGatekeeper, newGatekeeper.address, 'Gatekeeper not updated');

        transferEpoch = startingEpoch;
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
          assert.deepStrictEqual(transferredContest, expectedContest, `${name} contest should have been transferred`);

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

        await newGatekeeper.countVotes(epochNumber, GRANT);
        await newGatekeeper.countVotes(epochNumber, GOVERNANCE);

        const originalBalance = await token.balanceOf(recommender);
        utils.pMap(p => parameters.setValue(p), governancePermissions);
        utils.pMap(p => capacitor.withdrawTokens(p), grantPermissions);

        const newBalance = await token.balanceOf(recommender);
        assert.strictEqual(newBalance.toString(), originalBalance.add(new BN('1000')).toString(), 'Tokens not sent');

        const setStakeAmount = await parameters.getAsUint('slateStakeAmount');
        assert.strictEqual(setStakeAmount.toString(), '6000', 'Stake amount not updated');

        // Should be able to deposit tokens
        await newGatekeeper.depositVoteTokens('1000', { from: recommender });
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
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });
});
