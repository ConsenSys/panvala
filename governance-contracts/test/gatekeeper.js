/* eslint-env mocha */
/* global assert artifacts contract */

const utils = require('./utils');

const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');
const BasicToken = artifacts.require('BasicToken');


const {
  expectRevert,
  expectErrorLike,
  voteSingle,
  revealVote: reveal,
  ContestStatus,
  SlateStatus,
  commitBallot,
  BN,
  abiCoder,
  // printDate,
  timing,
  getResource,
  asBytes,
  createMultihash,
} = utils;

const { increaseTime } = utils.evm;
const { ONE_WEEK } = timing;


async function doRunoff(gatekeeper, ballotID, voters, options) {
  const { finalize = true } = options || {};
  const [alice, bob, carol] = voters;

  const resource = await getResource(gatekeeper, 'GRANT');

  // Run a vote that triggers a runoff
  await increaseTime(timing.VOTING_PERIOD_START);
  const aliceReveal = await voteSingle(gatekeeper, alice, resource, 0, 1, '800', '1234');
  const bobReveal = await voteSingle(gatekeeper, bob, resource, 1, 2, '900', '5678');
  const carolReveal = await voteSingle(gatekeeper, carol, resource, 2, 0, '1000', '9012');

  // Reveal all votes
  await increaseTime(timing.COMMIT_PERIOD_LENGTH);
  await reveal(ballotID, gatekeeper, aliceReveal);
  await reveal(ballotID, gatekeeper, bobReveal);
  await reveal(ballotID, gatekeeper, carolReveal);

  // Run -- slate 1 wins
  if (finalize) {
    await increaseTime(timing.REVEAL_PERIOD_LENGTH);
    await gatekeeper.countVotes(ballotID, resource);
    await gatekeeper.countRunoffVotes(ballotID, resource);
  }
}

async function doConfidenceVote(gatekeeper, ballotID, voters, options) {
  const { finalize = true } = options || {};
  const [alice, bob, carol] = voters;

  const resource = await getResource(gatekeeper, 'GRANT');

  await increaseTime(timing.VOTING_PERIOD_START);
  const aliceReveal = await voteSingle(gatekeeper, alice, resource, 0, 1, '1000', '1234');
  const bobReveal = await voteSingle(gatekeeper, bob, resource, 0, 1, '1000', '5678');
  const carolReveal = await voteSingle(gatekeeper, carol, resource, 1, 0, '1000', '9012');

  // Reveal all votes
  await increaseTime(timing.COMMIT_PERIOD_LENGTH);
  await reveal(ballotID, gatekeeper, aliceReveal);
  await reveal(ballotID, gatekeeper, bobReveal);
  await reveal(ballotID, gatekeeper, carolReveal);

  // Run - slate 0 wins
  if (finalize) {
    await increaseTime(timing.REVEAL_PERIOD_LENGTH);
    await gatekeeper.countVotes(ballotID, resource);
  }
}

async function currentEpochStart(gatekeeper) {
  const epochNumber = await gatekeeper.currentEpochNumber();
  const epochStart = await gatekeeper.epochStart(epochNumber);
  return epochStart;
}

contract('Gatekeeper', (accounts) => {
  let parameters;

  before(async () => {
    const stakeAmount = '5000';
    const [creator] = accounts;
    const token = await BasicToken.deployed();

    parameters = await ParameterStore.new(
      ['slateStakeAmount'],
      [abiCoder.encode(['uint256'], [stakeAmount])],
      { from: creator },
    );
    await parameters.setInitialValue(
      'tokenAddress',
      abiCoder.encode(['address'], [token.address]),
      { from: creator },
    );
    await parameters.init({ from: creator });
  });

  describe('constructor', () => {
    const [creator] = accounts;
    const startTime = '6000';

    it('should correctly initialize the gatekeeper', async () => {
      const gatekeeper = await Gatekeeper.new(
        startTime,
        parameters.address,
        { from: creator },
      );

      // Check initial values
      const actualParams = await gatekeeper.parameters({ from: creator });
      assert.strictEqual(actualParams.toString(), parameters.address);

      // start time
      const actualStartTime = await gatekeeper.startTime({ from: creator });
      assert.strictEqual(actualStartTime.toString(), startTime.toString());

      // epoch length
      const epochLength = await gatekeeper.EPOCH_LENGTH();
      assert.strictEqual(epochLength.toString(), timing.EPOCH_LENGTH.toString());
    });

    it('should fail if the parameter store address is zero', async () => {
      const parameterStoreAddress = utils.zeroAddress();

      try {
        await Gatekeeper.new(startTime, parameterStoreAddress, { from: creator });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Created Gatekeeper with a zero parameter store address');
    });

    it('should fail if the token address is zero', async () => {
      const badParameters = await ParameterStore.new(
        ['slateStakeAmount'],
        [abiCoder.encode(['uint256'], ['1000'])],
        { from: creator },
      );
      await badParameters.init({ from: creator });

      try {
        await Gatekeeper.new(startTime, badParameters.address, { from: creator });
      } catch (error) {
        expectRevert(error);

        return;
      }
      assert.fail('Created Gatekeeper with a zero token address');
    });
  });

  // Test the helper for creating gatekeepers
  describe('newGatekeeper helper', () => {
    const [creator] = accounts;
    let createdParameters;

    beforeEach(async () => {
      createdParameters = await ParameterStore.new(
        ['slateStakeAmount'],
        [abiCoder.encode(['uint256'], ['5000'])],
        { from: creator },
      );
    });

    it('should create a gatekeeper', async () => {
      const initialTokens = '10000000';
      const token = await utils.newToken({ initialTokens, from: creator });
      const gatekeeper = await utils.newGatekeeper({
        parameterStoreAddress: createdParameters.address,
        tokenAddress: token.address,
        from: creator,
      });

      const pa = await gatekeeper.parameters();
      assert.strictEqual(pa, createdParameters.address);
    });
  });

  describe('timing', () => {
    const [creator] = accounts;
    let gatekeeper;
    let GRANT;

    const firstEpochTime = new Date();
    const startTime = Math.floor(firstEpochTime / 1000);
    const votingPeriodLength = timing.VOTING_PERIOD_START;
    const halfVotingPeriod = votingPeriodLength.div(new BN(2));

    beforeEach(async () => {
      gatekeeper = await Gatekeeper.new(
        startTime,
        parameters.address,
        { from: creator },
      );

      GRANT = await getResource(gatekeeper, 'GRANT');
    });

    describe('initial epoch', () => {
      it('should correctly calculate the initial epoch number', async () => {
        const expected = 0;
        const epochNumber = await gatekeeper.currentEpochNumber();
        assert.strictEqual(
          epochNumber.toString(),
          expected.toString(),
          `Initial epoch number should have been ${expected}`,
        );
      });

      it('should calculate the start of the initial epoch as the system start time', async () => {
        const expected = startTime;
        const epochNumber = await gatekeeper.currentEpochNumber();
        const epochStart = await gatekeeper.epochStart(epochNumber);
        assert.strictEqual(
          epochStart.toString(),
          expected.toString(),
          'Initial epoch start should have been equal to system start time',
        );
      });
      it('should initialize the slate submission deadline', async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        const slateSubmissionDeadline = await gatekeeper.slateSubmissionDeadline(
          epochNumber,
          GRANT,
        );
        const expectedDeadline = new BN(startTime).add(halfVotingPeriod);
        assert.strictEqual(
          slateSubmissionDeadline.toString(),
          expectedDeadline.toString(),
          'Initial deadline should be 5.5 weeks in',
        );
      });
    });

    describe('future epoch', () => {
      let snapshotID;
      const numEpochs = new BN(3.5);

      before(async () => {
        snapshotID = await utils.evm.snapshot();

        // Go forward in time
        const offset = timing.EPOCH_LENGTH.mul(numEpochs);
        await increaseTime(offset);
      });

      it('should correctly calculate the epoch start time', async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        const epochStart = await gatekeeper.epochStart(epochNumber);
        const epochLength = await gatekeeper.EPOCH_LENGTH();
        const expected = (new BN(startTime)).add(epochLength.mul(numEpochs));
        assert.strictEqual(
          epochStart.toString(),
          expected.toString(),
          `Epoch start time should have been ${expected}`,
        );
      });

      it('should correctly calculate a subsequent epoch number', async () => {
        const expected = 3;

        const epochNumber = await gatekeeper.currentEpochNumber();
        assert.strictEqual(
          epochNumber.toString(),
          expected.toString(),
          `Epoch number should have been ${expected}`,
        );
      });

      it('should initialize the slate submission deadline', async () => {
        const epochNumber = await gatekeeper.currentEpochNumber();
        const epochStart = await gatekeeper.epochStart(epochNumber);
        const slateSubmissionDeadline = await gatekeeper.slateSubmissionDeadline(
          epochNumber,
          GRANT,
        );
        const expectedDeadline = new BN(epochStart).add(halfVotingPeriod);
        assert.strictEqual(
          slateSubmissionDeadline.toString(),
          expectedDeadline.toString(),
          'Initial deadline should be 5.5 weeks in',
        );
      });

      after(async () => {
        await utils.evm.revert(snapshotID);
      });
    });

    describe('timeTravel', () => {
      const [, alice] = accounts;
      let snapshotID;
      const getTime = () => Math.floor((new Date()).getTime() / 1000);

      beforeEach(async () => {
        snapshotID = await utils.evm.snapshot();
      });

      it('should go forward in time', async () => {
        const now = getTime();
        const initialTime = await utils.epochTime(gatekeeper, now, 'seconds');

        // Go forward
        const timeJump = ONE_WEEK;
        const receipt = await gatekeeper.timeTravel(timeJump, { from: creator });
        const { amount } = receipt.logs[0].args;
        assert.strictEqual(amount.toString(), timeJump.toString(), 'Emitted time jump was wrong');

        const finalTime = await utils.epochTime(gatekeeper, now, 'seconds');
        assert(finalTime > initialTime, 'Should have moved forward in time');
        const expectedTime = new BN(initialTime).add(timeJump);
        assert.strictEqual(finalTime.toString(), expectedTime.toString());
      });

      it('should go backward in time', async () => {
        // Go forward into the epoch
        const offset = ONE_WEEK.mul(new BN(10));
        await increaseTime(offset);

        // Get the initial timings
        const now = getTime();
        const initialTime = await utils.epochTime(gatekeeper, now, 'seconds');

        // Now go back again
        const timeJump = ONE_WEEK.neg();
        const receipt = await gatekeeper.timeTravel(timeJump, { from: creator });
        const { amount } = receipt.logs[0].args;
        assert.strictEqual(amount.toString(), timeJump.toString(), 'Emitted time jump was wrong');

        const finalTime = await utils.epochTime(gatekeeper, now, 'seconds');
        assert(finalTime < initialTime, 'Should have moved backward in time');
        const expectedTime = new BN(initialTime).add(timeJump);
        assert.strictEqual(finalTime.toString(), expectedTime.toString());
      });

      it('should revert if someone other than the owner tries to time travel', async () => {
        try {
          await gatekeeper.timeTravel(ONE_WEEK, { from: alice });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'Only the owner');
          return;
        }
        assert.fail('Allowed someone other than the owner to time travel');
      });

      it('should go back before a deadline', async () => {
        const resource = GRANT;
        // move forward to after the deadline
        const epochNumber = await gatekeeper.currentEpochNumber();
        const deadline = await gatekeeper.slateSubmissionDeadline(epochNumber, resource);
        const offset = ONE_WEEK.mul(new BN(6));

        await increaseTime(offset);
        const now = await utils.evm.timestamp();
        const submissionTime = new BN(now);
        assert(submissionTime.gt(deadline), 'Time is not after deadline');

        const metadataHash = utils.createMultihash('some slate');
        // Should not let submission
        try {
          await gatekeeper.recommendSlate(resource, [], utils.asBytes(metadataHash), {
            from: alice,
          });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'deadline passed');
        }

        // time travel
        await gatekeeper.timeTravel(ONE_WEEK.neg(), { from: creator });

        // Should now be able to submit
        await gatekeeper.recommendSlate(resource, [], utils.asBytes(metadataHash), {
          from: alice,
        });
      });

      afterEach(async () => {
        await utils.evm.revert(snapshotID);
      });
    });
  });

  describe('recommendSlate', () => {
    const [creator, recommender] = accounts;
    let gatekeeper;
    let capacitor;
    let requestIDs;
    const metadataHash = utils.createMultihash('my slate');
    let epochNumber;

    let GRANT;

    beforeEach(async () => {
      ({ gatekeeper, capacitor } = await utils.newPanvala({ from: creator }));
      epochNumber = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // Get requestIDs for the slate
      const proposalsReceipt = await capacitor.createManyProposals(
        [creator, recommender, creator, recommender],
        ['1000', '1000', '2000', '2000'],
        ['proposal1', 'proposal2', 'proposal3', 'proposal4'].map(p => utils.asBytes(utils.createMultihash(p))),
        { from: recommender },
      );

      requestIDs = proposalsReceipt.logs.map(l => l.args.requestID);
    });

    it('should create a new slate with the provided data', async () => {
      const resource = GRANT;

      // Initial status should be Empty
      const initialStatus = await gatekeeper.contestStatus(epochNumber, resource);
      assert.strictEqual(initialStatus.toString(), '0', 'Initial contest status should be Empty (0)');

      // Create a slate
      const receipt = await gatekeeper.recommendSlate(
        resource,
        requestIDs,
        utils.asBytes(metadataHash),
        { from: recommender },
      );

      // Verify log values
      const {
        slateID,
        recommender: emittedRecommender,
        metadataHash: emittedHash,
      } = receipt.logs[0].args;

      assert.strictEqual(slateID.toString(), '0', 'SlateID is incorrect');
      assert.strictEqual(emittedRecommender, recommender, 'Recommender is incorrect');
      assert.strictEqual(utils.bytesAsString(emittedHash), metadataHash, 'Metadata hash is incorrect');

      // Incremented slate count
      const slateCount = await gatekeeper.slateCount();
      assert.strictEqual(slateCount.toString(), '1', 'Slate count was not properly incremented');

      // Check that the slate was initialized properly
      const slate = await gatekeeper.slates(slateID);
      assert.strictEqual(slate.recommender, recommender, 'Recommender was not properly set');
      assert.strictEqual(utils.bytesAsString(slate.metadataHash), metadataHash, 'Metadata hash is incorrect');
      const storedRequests = await gatekeeper.slateRequests(slateID);
      assert.deepStrictEqual(
        storedRequests.map(r => r.toString()),
        requestIDs.map(r => r.toString()),
        'Requests were not properly stored',
      );
      // requestIncluded
      assert.strictEqual(slate.status.toString(), SlateStatus.Unstaked, 'Status should have been `Unstaked`');
      assert.strictEqual(slate.staker.toString(), utils.zeroAddress(), 'Staker should have been zero');
      assert.strictEqual(slate.stake.toString(), '0', 'Initial stake should have been zero');
      assert.strictEqual(slate.epochNumber.toString(), epochNumber.toString(), 'Incorrect epoch number');
      assert.strictEqual(slate.resource.toString(), resource.toString(), 'Incorrect resource');

      // Adding a slate without staking it should not change the contest status
      const status = await gatekeeper.contestStatus(epochNumber, resource);
      assert.strictEqual(status.toString(), ContestStatus.Empty, 'Contest status should be Empty (0)');
    });

    it('should allow creation of an empty slate', async () => {
      const resource = GRANT;
      const noRequests = [];

      // Create a slate
      const receipt = await gatekeeper.recommendSlate(
        resource,
        noRequests,
        utils.asBytes(metadataHash),
        { from: recommender },
      );

      const { slateID } = receipt.logs[0].args;
      const requests = await gatekeeper.slateRequests(slateID);
      assert.deepStrictEqual(requests, noRequests);
    });

    it('should revert if the metadataHash is empty', async () => {
      const resource = GRANT;
      const emptyHash = '';

      try {
        await gatekeeper.recommendSlate(
          resource,
          requestIDs,
          utils.asBytes(emptyHash),
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Recommended a slate with an empty metadataHash');
    });

    it('should revert if any of the requestIDs is invalid', async () => {
      const resource = GRANT;
      const invalidRequestIDs = [...requestIDs, requestIDs.length];

      try {
        await gatekeeper.recommendSlate(
          resource,
          invalidRequestIDs,
          utils.asBytes(metadataHash),
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Invalid requestID'));
        return;
      }
      assert.fail('Recommended a slate with an invalid requestID');
    });

    it('should revert if there are duplicate requestIDs', async () => {
      const resource = GRANT;
      const invalidRequestIDs = [...requestIDs, requestIDs[0]];

      try {
        await gatekeeper.recommendSlate(
          resource,
          invalidRequestIDs,
          utils.asBytes(metadataHash),
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Duplicate requests'));
        return;
      }
      assert.fail('Recommended a slate with duplicate requestIDs');
    });

    it('should revert if any of the requests have resources that do not match the one provided', async () => {
      const parameterStore = await ParameterStore.at(await gatekeeper.parameters());

      // Create grant proposal
      const grantRequestReceipt = await capacitor.createProposal(
        recommender,
        '1000',
        asBytes(utils.createMultihash('grant proposal')),
      );

      const { requestID: grantRequestID } = grantRequestReceipt.logs[0].args;

      // Create governance proposal
      const governanceRequestReceipt = await parameterStore.createProposal(
        'param',
        utils.abiEncode('uint256', '1000'),
        asBytes(utils.createMultihash('governance proposal')),
      );

      const { requestID: governanceRequestID } = governanceRequestReceipt.logs[0].args;

      // Try to create a grant slate with a governance request included
      const resource = capacitor.address;
      try {
        await gatekeeper.recommendSlate(
          resource,
          [grantRequestID, governanceRequestID],
          asBytes('mixed slate'),
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'does not match');
        return;
      }

      assert.fail('Allowed creation of a slate with mixed proposal types');
    });

    describe('timing', () => {
      let snapshotID;

      beforeEach(async () => {
        snapshotID = await utils.evm.snapshot();
      });

      it('should revert if the slate submission period is not active', async () => {
        const resource = GRANT;
        const deadline = await gatekeeper.slateSubmissionDeadline(epochNumber, resource);

        // move forward
        const offset = ONE_WEEK.mul(new BN(6));
        await increaseTime(offset);
        const now = await utils.evm.timestamp();
        const submissionTime = new BN(now);
        assert(submissionTime.gt(deadline), 'Time is not after deadline');

        try {
          await gatekeeper.recommendSlate(resource, requestIDs, utils.asBytes(metadataHash), {
            from: recommender,
          });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'deadline passed');
          return;
        }
        assert.fail('Allowed slate submission after the slate submission deadline');
      });

      afterEach(async () => {
        await utils.evm.revert(snapshotID);
      });
    });
  });

  describe('stakeTokens', () => {
    const [creator, recommender, staker, staker2] = accounts;
    let gatekeeper;
    let capacitor;
    let token;
    const initialTokens = '20000000';
    let GRANT;

    let epochNumber;
    const slateID = 0;
    let stakeAmount;
    let snapshotID;

    beforeEach(async () => {
      ({ gatekeeper, capacitor, token } = await utils.newPanvala({ initialTokens, from: creator }));
      GRANT = await getResource(gatekeeper, 'GRANT');

      snapshotID = await utils.evm.snapshot();

      epochNumber = await gatekeeper.currentEpochNumber();

      const proposals = [
        { to: staker, tokens: '1000', metadataHash: createMultihash('a') },
        { to: staker, tokens: '1000', metadataHash: createMultihash('b') },
        { to: staker, tokens: '1000', metadataHash: createMultihash('c') },
      ];
      const metadata = asBytes(createMultihash('grant slate'));

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals,
        capacitor,
        metadata,
        recommender,
      });

      stakeAmount = await parameters.getAsUint('slateStakeAmount');

      // Give out tokens
      const allocatedTokens = stakeAmount.add(new BN('10000'));
      await token.transfer(staker, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: staker });
    });

    it('should allow a user to stake tokens on a slate', async () => {
      const votingLength = timing.VOTING_PERIOD_START;

      const epochStart = await currentEpochStart(gatekeeper);

      // move forward in the slate submission period
      const offset = ONE_WEEK;
      await increaseTime(offset);

      // Stake tokens
      const initialBalance = await token.balanceOf(staker);
      const receipt = await gatekeeper.stakeTokens(slateID, { from: staker });
      const { blockNumber: stakingBlock } = receipt.receipt;
      const stakingTime = new BN(await utils.evm.timestamp(stakingBlock));

      // Check logs
      const {
        slateID: emittedSlateID,
        staker: emittedStaker,
        numTokens: emittedTokens,
      } = receipt.logs[0].args;

      assert.strictEqual(emittedSlateID.toString(), slateID.toString(), 'Emitted wrong slateID');
      assert.strictEqual(emittedStaker, staker, 'Emitted wrong staker');
      assert.strictEqual(emittedTokens.toString(), stakeAmount.toString(), 'Emitted wrong stake amount');

      // Slate should be staked, with staking info recorded
      const slate = await gatekeeper.slates(slateID);
      assert.strictEqual(slate.status.toString(), SlateStatus.Staked, 'Slate should be staked');
      assert.strictEqual(slate.stake.toString(), stakeAmount.toString(), 'Wrong stake was saved');
      assert.strictEqual(slate.staker, staker, 'Wrong staker was saved');

      // User's balance should have changed
      const finalBalance = await token.balanceOf(staker);
      const expectedBalance = initialBalance.sub(new BN(stakeAmount));
      assert.strictEqual(finalBalance.toString(), expectedBalance.toString(), 'Tokens were not transferred');

      const gatekeeperBalance = await token.balanceOf(gatekeeper.address);
      assert.strictEqual(
        gatekeeperBalance.toString(),
        stakeAmount.toString(),
        'Gatekeeper did not get the tokens',
      );

      // Should extend the slate submission deadline
      const finalSlateDeadline = await gatekeeper.slateSubmissionDeadline(epochNumber, GRANT);

      const votingStart = epochStart.add(votingLength);
      const timeLeft = votingStart.sub(stakingTime);
      const expectedDeadline = stakingTime.add(timeLeft.div(new BN(2)));
      assert.strictEqual(
        finalSlateDeadline.toString(),
        expectedDeadline.toString(),
        'Wrong deadline',
      );
    });

    it('should revert if the slate does not exist', async () => {
      const badSlateID = 500;
      try {
        await gatekeeper.stakeTokens(badSlateID, { from: staker });
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('No slate exists'));

        return;
      }
      assert.fail('Staked on a non-existent stake');
    });

    it('should revert if the user does not have enough tokens', async () => {
      const poorStaker = staker2;
      await token.transfer(poorStaker, stakeAmount.sub(new BN('1')), { from: creator });

      const initialBalance = await token.balanceOf(poorStaker);
      assert(initialBalance.lt(stakeAmount), 'Initial balance was not less than the stake amount');

      try {
        await gatekeeper.stakeTokens(slateID, { from: poorStaker });
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Insufficient token balance'));
        return;
      }
      assert.fail('Staked with insufficient balance');
    });

    it('should revert if the token transfer fails', async () => {
      const thisStaker = staker2;
      // Give the staker a sufficient balance, but don't approve the Gatekeeper to spend
      await token.transfer(thisStaker, stakeAmount, { from: creator });
      const initialBalance = await token.balanceOf(thisStaker);
      assert(initialBalance.gte(stakeAmount), 'Initial balance was not sufficient for staking');

      try {
        await gatekeeper.stakeTokens(slateID, { from: thisStaker });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Staked even though token transfer failed');
    });

    it('should revert if the slate has already been staked on', async () => {
      await token.transfer(staker, '10000', { from: creator });
      await token.approve(gatekeeper.address, '10000', { from: staker });

      await gatekeeper.stakeTokens(slateID, { from: staker });

      try {
        await gatekeeper.stakeTokens(slateID, { from: staker });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'already been staked');
        return;
      }
      assert.fail('Allowed a slate to be staked multiple times');
    });

    it('should revert if the slate submission period is not active', async () => {
      const resource = GRANT;
      const deadline = await gatekeeper.slateSubmissionDeadline(epochNumber, resource);

      // move forward
      const offset = ONE_WEEK.mul(new BN(6));
      await increaseTime(offset);
      const now = await utils.evm.timestamp();
      const submissionTime = new BN(now);
      assert(submissionTime.gt(deadline), 'Time is not after deadline');

      try {
        await gatekeeper.stakeTokens(slateID, {
          from: staker,
        });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'deadline passed');
        return;
      }
      assert.fail('Allowed slate staking after the slate submission deadline');
    });

    it('should correctly extend the deadline in future epochs', async () => {
      // move to a future epoch
      await increaseTime(timing.EPOCH_LENGTH.mul(new BN(3)));
      const futureEpoch = await gatekeeper.currentEpochNumber();
      const epochStart = await currentEpochStart(gatekeeper);

      const resource = GRANT;

      // Create a new slate
      const proposals = [
        { to: staker, tokens: '1000', metadataHash: createMultihash('a') },
      ];
      const metadata = asBytes(createMultihash('grant slate'));

      const thisSlateID = await gatekeeper.slateCount();
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals,
        capacitor,
        metadata,
        recommender,
      });

      // Check deadlines
      const two = new BN(2);
      const halfVoting = timing.VOTING_PERIOD_START.div(two);
      const expectedDeadline = epochStart.add(halfVoting);
      const deadline = await gatekeeper.slateSubmissionDeadline(futureEpoch, resource);

      // console.log('actual', printDate(deadline), deadline);
      // console.log('expected', printDate(expectedDeadline), expectedDeadline);
      assert.strictEqual(deadline.toString(), expectedDeadline.toString(), 'Wrong deadline');

      // move forward and stake
      await increaseTime(ONE_WEEK);
      // const dt = await utils.evm.timestamp();
      // console.log('epochTime', await utils.epochTime(gatekeeper, dt, 'days'));

      await gatekeeper.stakeTokens(thisSlateID, {
        from: staker,
      });
      const now = await utils.evm.timestamp();
      const submissionTime = new BN(now);

      // check the new deadline
      const extendedDeadline = await gatekeeper.slateSubmissionDeadline(futureEpoch, resource);
      const remaining = timing.VOTING_PERIOD_START.sub(submissionTime.sub(epochStart));
      const expectedExtendedDeadline = submissionTime.add(remaining.div(two));
      assert.strictEqual(
        extendedDeadline.toString(),
        expectedExtendedDeadline.toString(),
        'Extension was wrong',
      );
    });

    afterEach(async () => {
      await utils.evm.revert(snapshotID);
    });
  });

  describe('requestPermission', () => {
    const [creator, requestor] = accounts;
    let gatekeeper;
    const metadataHash = utils.createMultihash('my request data');
    const decode = utils.bytesAsString;

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });
    });

    it('should create a new Request', async () => {
      const receipt = await gatekeeper.requestPermission(
        utils.asBytes(metadataHash),
        { from: requestor },
      );

      // Check log values
      const {
        resource: emittedResource,
        requestID,
        metadataHash: emittedHash,
      } = receipt.logs[0].args;
      // console.log(emittedHash, metadataHash);
      assert.strictEqual(decode(emittedHash), metadataHash, 'Metadata hash is incorrect');
      assert.strictEqual(emittedResource, requestor, 'Emitted resource should match caller address');

      // Check Request
      const {
        metadataHash: requestHash,
        resource,
        approved,
        expirationTime,
      } = await gatekeeper.requests(requestID);
      assert.strictEqual(decode(requestHash), metadataHash, 'Metadata hash is incorrect');
      assert.strictEqual(approved, false);
      assert.strictEqual(resource, requestor, 'Requestor is incorrect');
      assert.strictEqual(expirationTime.toString(), '0', 'Expiration initialized incorrectly');

      // Request count was incremented
      const requestCount = await gatekeeper.requestCount();
      assert.strictEqual(requestCount.toString(), '1', 'Request count is incorrect');
    });

    // rejection criteria:
    it('should not allow an empty metadataHash', async () => {
      const emptyHash = '';

      try {
        await gatekeeper.requestPermission(
          utils.asBytes(emptyHash),
          { from: requestor },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed creation of a request with an empty metadataHash');
    });
  });

  describe('depositVoteTokens', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
    });

    it('should increase the user\'s voting balance', async () => {
      const allocatedTokens = '1000';

      // Make sure the voter has available tokens
      await token.transfer(voter, allocatedTokens, { from: creator });
      const tokenBalance = await token.balanceOf(voter);
      assert.strictEqual(tokenBalance.toString(), allocatedTokens, 'Voter did not get the tokens');

      // Give the Gatekeeper an allowance to spend
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });
      const allowance = await token.allowance(voter, gatekeeper.address);
      assert.strictEqual(allowance.toString(), allocatedTokens, 'Allowance is wrong');

      // Voter initially has no voting tokens
      const initialVotingBalance = await gatekeeper.voteTokenBalance(voter);
      assert.strictEqual(initialVotingBalance.toString(), '0');

      // Request
      const receipt = await gatekeeper.depositVoteTokens(allocatedTokens, { from: voter });

      // Emit event with correct values
      const { voter: emittedVoter, numTokens: emittedTokens } = receipt.logs[0].args;
      assert.strictEqual(emittedVoter, voter, 'Wrong voter address was emitted');
      assert.strictEqual(emittedTokens.toString(), allocatedTokens, 'Wrong token amount was emitted');

      // Vote token balance should have increased
      const finalVotingBalance = await gatekeeper.voteTokenBalance(voter);
      assert.strictEqual(finalVotingBalance.toString(), allocatedTokens);
    });

    it('should fail if the voter does not have enough tokens', async () => {
      const allocatedTokens = '1000';
      const requestedTokens = '1001';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // Request
      try {
        await gatekeeper.depositVoteTokens(requestedTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed voter to request rights for more tokens than they have');
    });

    it('should fail if the token transfer to the contract fails', async () => {
      const allocatedTokens = '1000';
      // use an allowance that is too small
      const allowance = '999';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allowance, { from: voter });

      // Request
      try {
        await gatekeeper.depositVoteTokens(allocatedTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed voter to request rights even though the token transfer failed');
    });
  });

  describe('withdrawVoteTokens', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      // Give the user some tokens
      const allocatedTokens = '1000';
      await token.transfer(voter, allocatedTokens, { from: creator });

      // Deposit the tokens
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });
      await gatekeeper.depositVoteTokens(allocatedTokens, { from: voter });
    });

    it('should decrease the user\'s voting balance', async () => {
      const numTokens = '1000';
      const initialBalance = await token.balanceOf(voter);
      const initialVoteBalance = await gatekeeper.voteTokenBalance(voter);

      // Withdraw tokens
      const receipt = await gatekeeper.withdrawVoteTokens(numTokens, { from: voter });

      // Check logs
      const { voter: emittedVoter, numTokens: emittedTokens } = receipt.logs[0].args;
      assert.strictEqual(emittedVoter, voter, 'Emitted voter was wrong');
      assert.strictEqual(emittedTokens.toString(), numTokens, 'Emitted numTokens was wrong');

      // Check balances
      const amount = new BN(numTokens);
      const balance = await token.balanceOf(voter);
      const expectedBalance = initialBalance.add(amount);
      assert.strictEqual(
        balance.toString(),
        expectedBalance.toString(),
        'Incorrect final token balance',
      );

      const voteBalance = await gatekeeper.voteTokenBalance(voter);
      const expectedVoteBalance = initialVoteBalance.sub(amount);
      assert.strictEqual(
        voteBalance.toString(),
        expectedVoteBalance.toString(),
        'Incorrect final vote token balance',
      );
    });

    it('should fail if the amount is greater than the user\'s vote token balance', async () => {
      const numTokens = '5000';

      const initialVoteBalance = await gatekeeper.voteTokenBalance(voter);
      assert(initialVoteBalance.lt(new BN(numTokens)), 'Balance should have been less than numTokens');

      // Withdraw tokens
      try {
        await gatekeeper.withdrawVoteTokens(numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Insufficient vote token balance'));
        return;
      }
      assert.fail('Withdrew more vote tokens than allowed');
    });

    it('should fail if the token transfer fails');

    describe('timing', () => {
      let snapshotID;
      const numTokens = '1000';

      beforeEach(async () => {
        snapshotID = await utils.evm.snapshot();
      });

      it('should revert if the commit period is active (and the user has committed?)', async () => {
        // Go to the commit period
        const offset = timing.VOTING_PERIOD_START;
        await increaseTime(offset);

        // Try to withdraw
        try {
          await gatekeeper.withdrawVoteTokens(numTokens, { from: voter });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'locked');
          return;
        }
        assert.fail('Allowed vote token withdrawal during commit period');
      });

      it('should allow withdrawal after the commit period', async () => {
        // Go after the commit period
        const offset = timing.VOTING_PERIOD_START.add(timing.COMMIT_PERIOD_LENGTH);
        await increaseTime(offset);

        await gatekeeper.withdrawVoteTokens(numTokens, { from: voter });
      });

      afterEach(async () => {
        await utils.evm.revert(snapshotID);
      });
    });
  });

  describe('delegateVotingRights', () => {
    const [creator, voter, delegate] = accounts;
    let gatekeeper;

    beforeEach(async () => {
      ({ gatekeeper } = await utils.newPanvala({ from: creator }));
    });

    it('should allow a voter to set a delegate account', async () => {
      const receipt = await gatekeeper.delegateVotingRights(delegate, { from: voter });

      assert.strictEqual(receipt.logs[0].event, 'DelegateSet', 'Wrong event was emitted');
      const { voter: emittedVoter, delegate: emittedDelegate } = receipt.logs[0].args;

      assert.strictEqual(emittedVoter, voter, 'Emitted wrong voter');
      assert.strictEqual(emittedDelegate, delegate, 'Emitted wrong voter');

      const storedDelegate = await gatekeeper.delegate(voter);
      assert.strictEqual(storedDelegate, delegate, 'Did not set delegate');
    });

    it('should revert if the delegate is the same as the sender', async () => {
      try {
        await gatekeeper.delegateVotingRights(voter, { from: voter });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'equal');
        return;
      }
      assert.fail('Allowed voter to be its own delegate');
    });

    it('should allow the voter to unset the delegate', async () => {
      // Set delegate
      const receipt = await gatekeeper.delegateVotingRights(delegate, { from: voter });
      const { delegate: setDelegate } = receipt.logs[0].args;

      // Unset delegate by setting to zero
      const noDelegate = utils.zeroAddress();
      await gatekeeper.delegateVotingRights(noDelegate, { from: voter });

      assert.notStrictEqual(setDelegate, noDelegate, 'Should have unset delegate');
    });
  });

  describe('commitBallot', () => {
    const [creator, voter, delegate, nonDelegate] = accounts;
    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;
    let snapshotID;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });
    });

    it('should successfully commit a ballot', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      await gatekeeper.depositVoteTokens(numTokens, { from: voter });

      await increaseTime(timing.VOTING_PERIOD_START);
      const receipt = await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      // Emit an event with the correct values
      const {
        voter: emittedVoter,
        numTokens: emittedTokens,
        commitHash: emittedHash,
      } = receipt.logs[0].args;

      // console.log(ballotID, emittedVoter, emittedTokens, emittedHash);
      assert.strictEqual(emittedVoter, voter, 'Emitted voter was wrong');
      assert.strictEqual(emittedTokens.toString(), numTokens, 'Emitted token amount was wrong');
      assert.strictEqual(utils.stripHexPrefix(emittedHash), commitHash.toString('hex'), 'Emitted hash was wrong');

      // Correctly store commitment
      const storedCommitHash = await gatekeeper.getCommitHash(ballotID, voter);
      assert.strictEqual(utils.stripHexPrefix(storedCommitHash.toString()), commitHash.toString('hex'), 'Stored commit hash is wrong');
    });

    it('should automatically deposit more vote tokens if the balance is low', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // Voter has no vote tokens
      const initialVotingBalance = await gatekeeper.voteTokenBalance(voter);
      assert.strictEqual(initialVotingBalance.toString(), '0');

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // Do not deposit any vote tokens, but commit anyway
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      // Voter's token balance has increased
      const finalVotingBalance = await gatekeeper.voteTokenBalance(voter);
      assert.strictEqual(finalVotingBalance.toString(), numTokens);

      // Correctly store commitment
      const storedCommitHash = await gatekeeper.getCommitHash(ballotID, voter);
      assert.strictEqual(utils.stripHexPrefix(storedCommitHash.toString()), commitHash.toString('hex'), 'Stored commit hash is wrong');
    });

    it('should fail if the commit period has not started', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      await gatekeeper.depositVoteTokens(numTokens, { from: voter });

      try {
        await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'not active');
        return;
      }
      assert.fail('Committed ballot before commit period');
    });

    it('should fail if the commit period has ended', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      await gatekeeper.depositVoteTokens(numTokens, { from: voter });

      // Advance to reveal period
      await increaseTime(timing.VOTING_PERIOD_START.add(timing.COMMIT_PERIOD_LENGTH));

      try {
        await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'not active');
        return;
      }
      assert.fail('Committed ballot after commit period');
    });

    it('should fail if the voter has already committed for this ballot', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // commit
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      // try to commit again
      try {
        await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Committed a ballot more than once');
    });

    it('should fail if commit hash is zero', async () => {
      const commitHash = utils.zeroHash();
      const numTokens = '1000';

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      try {
        await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'zero hash');
        return;
      }
      assert.fail('Committed a ballot with a zero commit hash');
    });

    describe('delegated', () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      beforeEach(async () => {
        await gatekeeper.delegateVotingRights(delegate, { from: voter });
      });

      it('should let a delegate commit a ballot for the voter', async () => {
        await gatekeeper.depositVoteTokens(numTokens, { from: voter });

        await increaseTime(timing.VOTING_PERIOD_START);
        const receipt = await gatekeeper.commitBallot(voter, commitHash, numTokens, {
          from: delegate,
        });

        // Emit an event with the correct values
        const {
          voter: emittedVoter,
          numTokens: emittedTokens,
          commitHash: emittedHash,
        } = receipt.logs[0].args;

        assert.strictEqual(emittedVoter, voter, 'Emitted voter was wrong');
        assert.strictEqual(emittedTokens.toString(), numTokens, 'Emitted token amount was wrong');
        assert.strictEqual(
          utils.stripHexPrefix(emittedHash),
          commitHash.toString('hex'),
          'Emitted hash was wrong',
        );

        // Correctly store commitment
        const storedCommitHash = await gatekeeper.getCommitHash(ballotID, voter);
        assert.strictEqual(
          utils.stripHexPrefix(storedCommitHash.toString()),
          commitHash.toString('hex'),
          'Stored commit hash is wrong',
        );
      });

      it('should revert if the delegate has tokens but the voter does not', async () => {
        // Give the delegate tokens and deposit them
        const delegateTokens = '10000';
        await token.transfer(delegate, delegateTokens, { from: creator });
        await token.approve(gatekeeper.address, delegateTokens, { from: delegate });
        await gatekeeper.depositVoteTokens(delegateTokens, { from: delegate });

        // Check voter balance
        const voterBalance = await gatekeeper.voteTokenBalance(voter);
        assert.strictEqual(voterBalance.toString(), '0', 'Voter should not have any voting tokens');

        // Try to commit for the voter
        await increaseTime(timing.VOTING_PERIOD_START);

        try {
          await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: delegate });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'Insufficient tokens');
          return;
        }

        assert.fail('Allowed delegate to vote for a voter with no voting tokens');
      });

      it('should revert if the committer is not a delegate for the voter', async () => {
        await gatekeeper.depositVoteTokens(numTokens, { from: voter });

        await increaseTime(timing.VOTING_PERIOD_START);

        try {
          await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: nonDelegate });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'Not a delegate');
          return;
        }
        assert.fail('Allowed someone other than the delegate to commit a ballot for the voter');
      });
    });

    afterEach(async () => {
      await utils.evm.revert(snapshotID);
    });
  });

  describe('didCommit', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let ballotID;
    let snapshotID;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      gatekeeper = await utils.newGatekeeper({
        // parameterStoreAddress: parameters.address,
        from: creator,
      });
      ballotID = await gatekeeper.currentEpochNumber();

      const allocatedTokens = '1000';

      const tokenAddress = await gatekeeper.token();
      const token = await BasicToken.at(tokenAddress);

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });
    });

    it('should return true if the voter has committed for the ballot', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // commit
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      const didCommit = await gatekeeper.didCommit(ballotID, voter);
      assert(didCommit, 'Voter committed, but didCommit returned false');
    });

    it('should return false if the voter has not committed for the ballot', async () => {
      const didCommit = await gatekeeper.didCommit(ballotID, voter);
      assert.strictEqual(didCommit, false, 'Voter did not commit, but didCommit returned true');
    });

    it("should return true if a delegate voted on the voter's behalf", async () => {
      const [, , delegate] = accounts;
      await gatekeeper.delegateVotingRights(delegate, { from: voter });

      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // commit
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      const didCommit = await gatekeeper.didCommit(ballotID, voter);
      assert(didCommit, 'Voter committed, but didCommit returned false');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('getCommitHash', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let ballotID;
    let snapshotID;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      gatekeeper = await utils.newGatekeeper({ from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      const allocatedTokens = '1000';

      const tokenAddress = await gatekeeper.token();
      const token = await BasicToken.at(tokenAddress);

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });
    });

    it('should return the commit hash if the voter has committed for the ballot', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // commit
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      const storedCommitHash = await gatekeeper.getCommitHash(ballotID, voter);
      assert.strictEqual(
        utils.stripHexPrefix(storedCommitHash.toString()),
        commitHash.toString('hex'),
        'Stored commit hash is wrong',
      );
    });

    it('should revert if the voter has not committed for the ballot', async () => {
      try {
        await gatekeeper.getCommitHash(ballotID, voter);
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'not committed');
        return;
      }
      assert.fail('Voter did not commit for the given ballot');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });


  describe('revealBallot', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    const initialTokens = '20000000';
    let snapshotID;
    let GRANT;
    let GOVERNANCE;

    let ballotID;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({
        gatekeeper, capacitor, token, parameters,
      } = await utils.newPanvala({
        initialTokens,
        from: creator,
      }));
      ballotID = await gatekeeper.currentEpochNumber();
      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // Make sure the recommender has plenty of tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // New slates 0, 1
      // grant
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      }, { from: recommender });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // New slates 2, 3
      // governance
      const governanceProposals = [
        {
          key: 'param',
          value: utils.abiEncode('uint256', '1000'),
          metadataHash: createMultihash('governance'),
        },
      ];
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore: parameters,
        recommender,
        metadata: 'governance slate',
      });

      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore: parameters,
        recommender,
        metadata: 'competing slate',
      });

      await gatekeeper.stakeTokens(2, { from: recommender });
      await gatekeeper.stakeTokens(3, { from: recommender });

      // Commit a ballot
      votes = {
        [GRANT]: { firstChoice: 0, secondChoice: 1 },
        [GOVERNANCE]: { firstChoice: 2, secondChoice: 3 },
      };

      // helper: commitBallot -> revealData
      const salt = 2000;
      numTokens = '1000';
      commitHash = utils.generateCommitHash(votes, salt);

      // commit here
      await increaseTime(timing.VOTING_PERIOD_START);
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      // set up reveal data
      const resources = Object.keys(votes);
      const firstChoices = resources.map(cat => votes[cat].firstChoice);
      const secondChoices = resources.map(cat => votes[cat].secondChoice);

      revealData = {
        resources,
        firstChoices,
        secondChoices,
        salt,
      };
    });

    it('should successfully reveal a ballot', async () => {
      // didReveal should be false
      const initialDidReveal = await gatekeeper.didReveal(ballotID, voter);
      assert.strictEqual(initialDidReveal, false, 'didReveal should have been false before reveal');

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      // Reveal
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      const receipt = await gatekeeper.revealBallot(
        ballotID,
        voter,
        resources,
        firstChoices,
        secondChoices,
        salt,
      );

      // Emit an event with the correct values
      const {
        ballotID: emittedBallotID,
        voter: emittedVoter,
        numTokens: emittedTokens,
      } = receipt.logs[0].args;

      assert.strictEqual(
        emittedBallotID.toString(),
        ballotID.toString(),
        'Emitted ballot ID was incorrect',
      );
      assert.strictEqual(emittedVoter, voter, 'Emitted voter address was incorrect');
      assert.strictEqual(emittedTokens.toString(), numTokens, 'Emitted num tokens was incorrect');

      // Check grant contest
      const [slate0Votes, slate1Votes] = await Promise.all(
        [0, 1].map(slateID => gatekeeper.getFirstChoiceVotes(ballotID, GRANT, slateID)),
      );

      const [slate0SecondVotes, slate1SecondVotes] = await Promise.all(
        [0, 1].map(slateID => gatekeeper.getSecondChoiceVotes(ballotID, GRANT, slateID)),
      );
      // First-choice votes all went to slate 0
      assert.strictEqual(slate0Votes.toString(), numTokens, 'Slate should have had all the votes');
      assert.strictEqual(slate1Votes.toString(), '0', 'Slate should have had no votes');

      // Second-choice votes all went to slate 1
      assert.strictEqual(slate0SecondVotes.toString(), '0', 'Slate should have had no second votes');
      assert.strictEqual(slate1SecondVotes.toString(), numTokens, 'Slate should have had all the second votes');

      // Check governance contest
      const [slate2Votes, slate3Votes] = await Promise.all(
        [2, 3].map(slateID => gatekeeper.getFirstChoiceVotes(ballotID, GOVERNANCE, slateID)),
      );

      const [slate2SecondVotes, slate3SecondVotes] = await Promise.all(
        [2, 3].map(slateID => gatekeeper.getSecondChoiceVotes(ballotID, GOVERNANCE, slateID)),
      );

      // First-choice votes all went to slate 2
      assert.strictEqual(slate2Votes.toString(), numTokens, 'Slate should have had all the votes');
      assert.strictEqual(slate3Votes.toString(), '0', 'Slate should have had no votes');

      // Second-choice votes all went to slate 3
      assert.strictEqual(slate2SecondVotes.toString(), '0', 'Slate should have had no second votes');
      assert.strictEqual(slate3SecondVotes.toString(), numTokens, 'Slate should have had all the second votes');

      // didReveal should be true
      const didReveal = await gatekeeper.didReveal(ballotID, voter);
      assert.strictEqual(didReveal, true, 'didReveal should have been true after reveal');
    });

    it('should revert if the submitted data does not match the committed ballot', async () => {
      const { resources, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices,
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'ballot does not match commitment');
        return;
      }
      assert.fail('Revealed ballot with different data from what was committed');
    });

    // Inputs
    it('should fail if the supplied voter address is zero', async () => {
      const badVoter = utils.zeroAddress();

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      // Reveal
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          ballotID,
          badVoter,
          resources,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Voter address cannot be zero');
        return;
      }
      assert.fail('Revealed with zero address');
    });

    it('should fail if the number of resources does not match', async () => {
      const { resources, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources.slice(0, 1),
          firstChoices,
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'inputs must have the same length');
        return;
      }
      assert.fail('Revealed ballot with wrong number of resources');
    });

    it('should fail if the number of firstChoices does not match', async () => {
      const { resources, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices.slice(0, 1),
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'inputs must have the same length');
        return;
      }
      assert.fail('Revealed ballot with wrong number of firstChoices');
    });

    it('should fail if the number of secondChoices does not match', async () => {
      const { resources, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices,
          secondChoices.slice(0, 1),
          salt,
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'inputs must have the same length');
        return;
      }
      assert.fail('Revealed ballot with wrong number of secondChoices');
    });

    it('should fail if any of the choices do not correspond to valid slates');

    // State
    it('should fail if the voter has not committed for the ballot', async () => {
      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      // Reveal for a non-voter
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          ballotID,
          nonvoter,
          resources,
          firstChoices,
          secondChoices,
          salt,
          { from: nonvoter },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Voter has not committed');
        return;
      }
      assert.fail('Revealed for a voter who has not committed for the ballot');
    });

    it('should fail if the voter has already revealed for the ballot', async () => {
      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      // Reveal
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      await gatekeeper.revealBallot(
        ballotID,
        voter,
        resources,
        firstChoices,
        secondChoices,
        salt,
        { from: voter },
      );

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Voter has already revealed');
        return;
      }
      assert.fail('Revealed for a voter who has already revealed for the ballot');
    });

    it('should fail if the reveal period has not started', async () => {
      // Reveal
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Reveal period not active');
        return;
      }
      assert.fail('Revealed ballot before the reveal period');
    });

    it('should fail if the reveal period has ended', async () => {
      const offset = timing.COMMIT_PERIOD_LENGTH.add(timing.REVEAL_PERIOD_LENGTH);
      await increaseTime(offset);

      // Reveal
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          ballotID,
          voter,
          resources,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Reveal period not active');
        return;
      }
      assert.fail('Revealed ballot after the reveal period');
    });

    afterEach(async () => {
      await utils.evm.revert(snapshotID);
    });
  });

  describe('revealManyBallots', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    const initialTokens = '20000000';
    let ballotID;
    let snapshotID;
    let GRANT;
    let GOVERNANCE;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({
        gatekeeper, capacitor, token, parameters,
      } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();
      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // Set up ballot
      // New slates 0, 1
      // grant
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // New slates 2, 3
      // governance
      const governanceProposals = [
        {
          key: 'param',
          value: utils.abiEncode('uint256', '1000'),
          metadataHash: createMultihash('governance'),
        },
      ];
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore: parameters,
        recommender,
        metadata: 'governance slate',
      });

      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore: parameters,
        recommender,
        metadata: 'competing slate',
      });

      await gatekeeper.stakeTokens(2, { from: recommender });
      await gatekeeper.stakeTokens(3, { from: recommender });

      // Give everyone tokens
      const allocatedTokens = '1000';
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });
    });

    it('should correctly reveal multiple ballots', async () => {
      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      const [aliceSalt, bobSalt, carolSalt] = ['1234', '5678', '9012'];

      const aliceReveal = await commitBallot(gatekeeper, alice, [[GRANT, 0, 1], [GOVERNANCE, 2, 3]], '1000', aliceSalt);
      const bobReveal = await commitBallot(gatekeeper, bob, [[GRANT, 0, 1], [GOVERNANCE, 2, 3]], '1000', bobSalt);
      const carolReveal = await commitBallot(gatekeeper, carol, [[GRANT, 1, 0], [GOVERNANCE, 2, 3]], '1000', carolSalt);

      // Prepare data
      const voters = [alice, bob, carol];
      const ballots = [aliceReveal, bobReveal, carolReveal].map(_reveal => utils.encodeBallot(
        _reveal.resources,
        _reveal.firstChoices,
        _reveal.secondChoices,
      ));
      const salts = [aliceSalt, bobSalt, carolSalt];

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);

      // Reveal
      const receipt = await gatekeeper.revealManyBallots(ballotID, voters, ballots, salts);

      // should have emitted 3 BallotRevealed events
      assert.strictEqual(receipt.logs.length, 3);
      assert.deepStrictEqual(
        receipt.logs.map(l => l.event),
        ['BallotRevealed', 'BallotRevealed', 'BallotRevealed'],
        'Incorrect events emitted',
      );

      // check first and second choice votes
      const slate0Votes = await utils.getVotes(gatekeeper, ballotID, GRANT, 0);
      const slate1Votes = await utils.getVotes(gatekeeper, ballotID, GRANT, 1);
      assert.strictEqual(slate0Votes.toString(), '2000,1000');
      assert.strictEqual(slate1Votes.toString(), '1000,2000');

      const slate2Votes = await utils.getVotes(gatekeeper, ballotID, GOVERNANCE, 2);
      const slate3Votes = await utils.getVotes(gatekeeper, ballotID, GOVERNANCE, 3);
      assert.strictEqual(slate2Votes.toString(), '3000,0');
      assert.strictEqual(slate3Votes.toString(), '0,3000');

      // Everyone should be marked as having revealed
      const didReveal = await Promise.all(voters.map(v => gatekeeper.didReveal(ballotID, v)));
      didReveal.forEach(revealed => assert.strictEqual(revealed, true, 'Voter should have revealed'));
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('didReveal', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let parameterStore;
    const initialTokens = '20000000';
    let snapshotID;
    let GRANT;
    let GOVERNANCE;

    let ballotID;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({
        gatekeeper, token, capacitor, parameters: parameterStore,
      } = await utils.newPanvala({
        initialTokens,
        from: creator,
      }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // grant - slates 0, 1
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // governance - slates 2, 3
      const governanceProposals = [
        {
          key: 'param',
          value: utils.abiEncode('uint256', '1000'),
          metadataHash: createMultihash('governance'),
        },
      ];
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore,
        recommender,
        metadata: 'governance slate',
      });

      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore,
        recommender,
        metadata: 'competing slate',
      });

      await gatekeeper.stakeTokens(2, { from: recommender });
      await gatekeeper.stakeTokens(3, { from: recommender });

      // Commit a ballot
      votes = {
        [GRANT]: { firstChoice: 0, secondChoice: 1 },
        [GOVERNANCE]: { firstChoice: 2, secondChoice: 3 },
      };

      const salt = 2000;
      numTokens = '1000';
      commitHash = utils.generateCommitHash(votes, salt);

      // Advance to commit period
      await increaseTime(timing.VOTING_PERIOD_START);

      // commit
      await gatekeeper.commitBallot(voter, commitHash, numTokens, { from: voter });

      // set up reveal data
      const resources = Object.keys(votes);
      const firstChoices = resources.map(cat => votes[cat].firstChoice);
      const secondChoices = resources.map(cat => votes[cat].secondChoice);

      revealData = {
        resources,
        firstChoices,
        secondChoices,
        salt,
      };

      // Advance to reveal period
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
    });

    it('should return true if the voter has revealed for the ballot', async () => {
      const {
        resources, firstChoices, secondChoices, salt,
      } = revealData;

      await gatekeeper.revealBallot(
        ballotID,
        voter,
        resources,
        firstChoices,
        secondChoices,
        salt,
        { from: voter },
      );

      const didReveal = await gatekeeper.didReveal(ballotID, voter);
      assert.strictEqual(didReveal, true, 'didReveal returned false when the voter HAS revealed');
    });

    it('should return false if the voter has not revealed', async () => {
      const didReveal = await gatekeeper.didReveal(ballotID, voter);
      assert.strictEqual(didReveal, false, 'didReveal returned true when the voter has NOT revealed');
    });

    it('should return false if the voter has not committed', async () => {
      const didReveal = await gatekeeper.didReveal(ballotID, nonvoter);
      assert.strictEqual(didReveal, false, 'didReveal returned true when the voter has NOT COMMITTED');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('countVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let parameterStore;
    const initialTokens = '20000000';
    let ballotID;
    let snapshotID;
    let GRANT;
    let GOVERNANCE;

    const governanceProposals = [
      {
        key: 'param',
        value: utils.abiEncode('uint256', '1000'),
        metadataHash: createMultihash('governance'),
      },
    ];

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({
        gatekeeper, token, capacitor, parameters: parameterStore,
      } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');
      GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
    });

    it('should correctly tally the votes and finalize a confidence vote', async () => {
      // basic confidence vote
      // slate 0 should win

      // Commit for voters
      await increaseTime(timing.VOTING_PERIOD_START);

      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // status: Active
      const initialStatus = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        initialStatus.toString(),
        ContestStatus.Active,
        'Contest status should have been Active',
      );

      const receipt = await gatekeeper.countVotes(ballotID, GRANT);

      // should emit events
      assert.strictEqual(receipt.logs.length, 2, 'Should have emitted 2 events');

      // ConfidenceVoteCounted
      assert.strictEqual(receipt.logs[0].event, 'ConfidenceVoteCounted');
      const {
        ballotID: ballotID0,
        resource: resource0,
        winningSlate: emittedWinner,
        votes: emittedWinnerVotes,
        totalVotes: emittedTotal,
      } = receipt.logs[0].args;

      assert.strictEqual(ballotID0.toString(), ballotID.toString(), 'Emitted ballotID did not match');
      assert.strictEqual(resource0.toString(), GRANT.toString(), 'Emitted resource did not match');
      assert.strictEqual(emittedWinner.toString(), '0', 'Slate 0 should have won');
      assert.strictEqual(emittedWinnerVotes.toString(), '2000', 'Winner had the wrong number of votes');
      assert.strictEqual(emittedTotal.toString(), '3000', 'Total vote count was wrong');

      // ConfidenceVoteFinalized
      assert.strictEqual(receipt.logs[1].event, 'ConfidenceVoteFinalized');
      const {
        ballotID: ballotID1,
        resource: resource1,
        winningSlate,
      } = receipt.logs[1].args;

      assert.strictEqual(ballotID1.toString(), ballotID.toString(), 'Emitted ballotID did not match');
      assert.strictEqual(resource1.toString(), GRANT.toString(), 'Emitted resource did not match');
      assert.strictEqual(winningSlate.toString(), '0', 'Slate 0 should have won');

      // Status should be updated
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.Finalized,
        'Contest status should have been Finalized',
      );

      // Winning slate should have status Accepted
      const slate = await gatekeeper.slates(winningSlate);
      assert.strictEqual(
        slate.status.toString(),
        SlateStatus.Accepted,
        'Winning slate status should have been Accepted',
      );

      // All the other slates should have status Rejected
      const contestSlates = await gatekeeper.contestSlates.call(ballotID, GRANT);
      const statuses = await Promise.all(
        contestSlates.filter(s => s.toString() !== winningSlate.toString())
          .map(id => gatekeeper.slates.call(id)
            .then(s => s.status)),
      );

      statuses.forEach((_status) => {
        assert.strictEqual(
          _status.toString(),
          SlateStatus.Rejected,
          'Non-winning slate should have status Rejected',
        );
      });

      // requests in the slate should all return true for hasPermission
      const slateRequests = await gatekeeper.slateRequests(winningSlate);
      const permissions = await Promise.all(slateRequests.map(r => gatekeeper.hasPermission(r)));
      permissions.forEach((has) => {
        assert.strictEqual(has, true, 'Request should have permission');
      });

      // all should have expirations set to an epoch in the future
      const ts = await utils.evm.timestamp(receipt.receipt.blockNumber);
      const expectedExpiration = new BN(ts).add(timing.EPOCH_LENGTH);
      const requests = await Promise.all(slateRequests.map(r => gatekeeper.requests(r)));
      requests.forEach((request) => {
        assert.strictEqual(
          request.expirationTime.toString(),
          expectedExpiration.toString(),
          'Expiration should have been an epoch in the future',
        );
      });

      // the current incumbent should be the recommender of the winning slate
      const incumbent = await gatekeeper.incumbent(GRANT);
      assert.strictEqual(
        incumbent,
        slate.recommender,
        'Incumbent should be the recommender of the winning slate',
      );
    });

    it('should revert if the resource has no staked slates', async () => {
      // Add a new governance slate, but don't stake
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore,
        recommender,
        metadata: 'governance slate',
      });

      // Advance past reveal period
      await increaseTime(timing.EPOCH_LENGTH);

      // Governance has no staked slates, not in progress
      try {
        await gatekeeper.countVotes(ballotID, GOVERNANCE);
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Tallied votes for resource with no staked slates');
    });

    it('should declare a slate as the winner if it is the only staked slate in the resource', async () => {
      const slateID = await gatekeeper.slateCount();

      // Add a new governance slate
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore,
        recommender,
        metadata: 'governance slate',
      });
      await gatekeeper.stakeTokens(slateID, { from: recommender });

      // status: NoContest
      const initialStatus = await gatekeeper.contestStatus(ballotID, GOVERNANCE);
      assert.strictEqual(
        initialStatus.toString(),
        ContestStatus.NoContest,
        'Contest status should have been NoContest',
      );

      await increaseTime(timing.EPOCH_LENGTH);
      const receipt = await gatekeeper.countVotes(ballotID, GOVERNANCE);

      // Check events
      assert.strictEqual(receipt.logs[0].event, 'ContestAutomaticallyFinalized');
      const {
        ballotID: emittedBallotID,
        resource: emittedResource,
        winningSlate: emittedWinner,
      } = receipt.logs[0].args;
      assert.strictEqual(emittedBallotID.toString(), ballotID.toString(), 'Wrong ballotID emitted');
      assert.strictEqual(emittedResource.toString(), GOVERNANCE.toString(), 'Wrong resource emitted');
      assert.strictEqual(emittedWinner.toString(), slateID.toString(), 'Wrong winner emitted');

      // Slate should be Accepted
      const { status } = await gatekeeper.slates(slateID);
      assert.strictEqual(
        status.toString(),
        SlateStatus.Accepted,
        'Slate should have been accepted',
      );

      // Contest should be Finalized
      const contestStatus = await gatekeeper.contestStatus(ballotID, GOVERNANCE);
      assert.strictEqual(
        contestStatus.toString(),
        ContestStatus.Finalized,
        'Contest should have status Finalized',
      );
    });

    it('should ignore votes for unstaked slates', async () => {
      // Add another grant slate, but don't stake
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('an unstaked slate'),
      });

      // David votes for it with lots of power
      const david = accounts[5];
      const manyTokens = '10000';
      await token.transfer(david, manyTokens, { from: creator });
      await token.approve(gatekeeper.address, manyTokens, { from: david });

      // Commit for voters
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');
      const davidReveal = await voteSingle(gatekeeper, david, GRANT, 2, 1, manyTokens, '1337');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);
      await reveal(ballotID, gatekeeper, davidReveal);

      // Finalize
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);
      const receipt = await gatekeeper.countVotes(ballotID, GRANT);

      const expectedWinner = '0';
      const {
        winningSlate: emittedWinner,
        votes: emittedWinnerVotes,
        totalVotes: emittedTotal,
      } = receipt.logs[0].args;
      assert.strictEqual(emittedWinner.toString(), expectedWinner, 'Emitted leader was wrong');
      assert.strictEqual(emittedWinnerVotes.toString(), '2000', 'Winner had the wrong number of votes');
      assert.strictEqual(emittedTotal.toString(), '3000', 'Total vote count was wrong');

      const { winningSlate } = receipt.logs[1].args;
      assert.strictEqual(
        winningSlate.toString(),
        expectedWinner,
        `Slate ${expectedWinner} should have won`,
      );
    });

    it('should wait for a runoff if no slate has more than 50% of the votes', async () => {
      const slateID = await gatekeeper.slateCount();
      // Add a third slate
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });
      await gatekeeper.stakeTokens(slateID, { from: recommender });

      // Split the votes among the three slates
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 1, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Check logs
      const receipt = await gatekeeper.countVotes(ballotID, GRANT);
      utils.expectEvents(receipt, ['ConfidenceVoteCounted', 'ConfidenceVoteFailed']);

      // Should be waiting for a runoff
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.RunoffPending,
        'Contest status should have been RunoffPending',
      );
    });

    it('should wait for a runoff if the lead slate has exactly 50% of the votes', async () => {
      // Split the votes evenly
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '500', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '500', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Check logs
      const receipt = await gatekeeper.countVotes(ballotID, GRANT);
      utils.expectEvents(receipt, ['ConfidenceVoteCounted', 'ConfidenceVoteFailed']);

      // Should be waiting for a runoff
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.RunoffPending,
        'Contest status should have been RunoffPending',
      );
    });

    it('should revert if called more than once', async () => {
      // Commit for voters
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      await gatekeeper.countVotes(ballotID, GRANT);

      try {
        await gatekeeper.countVotes(ballotID, GRANT);
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'in progress');
        return;
      }

      assert.fail('Called countVotes() more than once');
    });

    it('should revert if the contest has multiple slates and the reveal period is still active', async () => {
      // Advance to reveal period
      await increaseTime(timing.VOTING_PERIOD_START);

      try {
        await gatekeeper.countVotes(ballotID, GRANT);
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Reveal period still active');
        return;
      }

      assert.fail('Counted votes while reveal period was still active');
    });

    it('should allow finalization during the reveal period if the contest has an unopposed slate', async () => {
      const slateID = await gatekeeper.slateCount();

      // Add a new governance slate
      await utils.governanceSlateFromProposals({
        gatekeeper,
        proposals: governanceProposals,
        parameterStore,
        recommender,
        metadata: 'governance slate',
      });
      await gatekeeper.stakeTokens(slateID, { from: recommender });

      // Advance to reveal period
      await increaseTime(timing.VOTING_PERIOD_START);

      // Finalize
      await gatekeeper.countVotes(ballotID, GOVERNANCE);
      const status = await gatekeeper.contestStatus(ballotID, GOVERNANCE);
      assert.strictEqual(status.toString(), ContestStatus.Finalized);
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('getFirstChoiceVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    const initialTokens = '20000000';
    let ballotID;
    let snapshotID;
    let GRANT;


    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      const grantProposals = [{
        to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
      }];

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
      await gatekeeper.stakeTokens(2, { from: recommender });
    });

    it('should correctly get the number of first choice votes for a slate', async () => {
      // Commit for voters
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // expect 2000, 1000, 0
      const slate0Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 0);
      assert.strictEqual(slate0Votes.toString(), '2000');
      const slate1Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 1);
      assert.strictEqual(slate1Votes.toString(), '1000');
      const slate2Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 2);
      assert.strictEqual(slate2Votes.toString(), '0');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('contestStatus', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let token;
    let capacitor;

    const initialTokens = '20000000';
    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];


    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should return Empty if the resource has no staked slates', async () => {
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.Empty,
        'Contest status should have been Empty',
      );
    });

    it('should return NoContest if the resource has only a single staked slate', async () => {
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('another slate'),
      });

      // Only stake on one
      await gatekeeper.stakeTokens(0, { from: recommender });

      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.NoContest,
        'Contest status should have been NoContest',
      );
    });

    it('should return Active if the resource has two or more staked slates', async () => {
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      // Stake on two
      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });


      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.Active,
        'Contest status should have been Active',
      );
    });
  });

  describe('countRunoffVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let snapshotID;

    const initialTokens = '20000000';
    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];


    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, capacitor, token } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
      await gatekeeper.stakeTokens(2, { from: recommender });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });
    });

    it('should correctly tally and finalize a runoff vote', async () => {
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Runoff
      const receipt = await gatekeeper.countRunoffVotes(ballotID, GRANT);

      // Should emit events
      assert.strictEqual(receipt.logs.length, 3);
      assert.strictEqual(receipt.logs[0].event, 'RunoffStarted', 'First event is incorrect');
      assert.strictEqual(receipt.logs[1].event, 'RunoffCounted', 'Second event is incorrect');
      assert.strictEqual(receipt.logs[2].event, 'RunoffFinalized', 'Third event is incorrect');

      // RunoffStarted
      const { winningSlate: emittedWinner, runnerUpSlate: emittedRunnerUp } = receipt.logs[0].args;
      assert.strictEqual(emittedWinner.toString(), '2', 'Confidence vote winner should have been slate 2');
      assert.strictEqual(emittedRunnerUp.toString(), '1', 'Confidence vote runner-up should have been slate 1');

      // RunoffCounted
      const {
        winningSlate: countWinner,
        winnerVotes: countWinnerVotes,
        losingSlate: countLoser,
        loserVotes: countLoserVotes,
      } = receipt.logs[1].args;

      const expectedWinner = '1';
      const expectedVotes = (900 + 800).toString();
      const expectedLoser = '2';
      const expectedLoserVotes = '1000';

      assert.strictEqual(countWinner.toString(), expectedWinner, 'Incorrect winner in runoff count');
      assert.strictEqual(countWinnerVotes.toString(), expectedVotes, 'Incorrect winning votes in runoff count');
      assert.strictEqual(countLoser.toString(), expectedLoser, 'Incorrect loser in runoff count');
      assert.strictEqual(countLoserVotes.toString(), expectedLoserVotes, 'Incorrect loser votes in runoff count');

      // RunoffFinalized
      const { winningSlate } = receipt.logs[2].args;

      assert.strictEqual(winningSlate.toString(), expectedWinner, 'Runoff finalized with wrong winner');

      // status should be Finalized at the end
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.Finalized,
        'Contest status should have been Finalized',
      );

      // Winning slate should have status Accepted
      const slate = await gatekeeper.slates(winningSlate);
      assert.strictEqual(
        slate.status.toString(),
        SlateStatus.Accepted,
        'Winning slate status should have been Accepted',
      );

      // All the other slates should have status Rejected
      const contestSlates = await gatekeeper.contestSlates.call(ballotID, GRANT);
      const statuses = await Promise.all(
        contestSlates.filter(s => s.toString() !== winningSlate.toString())
          .map(id => gatekeeper.slates.call(id)
            .then(s => s.status)),
      );

      statuses.forEach((_status) => {
        assert.strictEqual(
          _status.toString(),
          SlateStatus.Rejected,
          'Non-winning slate should have status Rejected',
        );
      });

      // requests in the slate should all return true for hasPermission
      const slateRequests = await gatekeeper.slateRequests(winningSlate);
      const permissions = await Promise.all(slateRequests.map(r => gatekeeper.hasPermission(r)));
      permissions.forEach((has) => {
        assert.strictEqual(has, true, 'Request should have permission');
      });

      // all should have expirations set to an epoch in the future
      const ts = await utils.evm.timestamp(receipt.receipt.blockNumber);
      const expectedExpiration = new BN(ts).add(timing.EPOCH_LENGTH);
      const requests = await Promise.all(slateRequests.map(r => gatekeeper.requests(r)));
      requests.forEach((request) => {
        assert.strictEqual(
          request.expirationTime.toString(),
          expectedExpiration.toString(),
          'Expiration should have been an epoch in the future',
        );
      });

      // the current incumbent should be the recommender of the winning slate
      const incumbent = await gatekeeper.incumbent(GRANT);
      assert.strictEqual(
        incumbent,
        slate.recommender,
        'Incumbent should be the recommender of the winning slate',
      );
    });

    it('should count correctly if the original leader wins the runoff', async () => {
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '99', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Runoff
      const receipt = await gatekeeper.countRunoffVotes(ballotID, GRANT);

      // RunoffCounted
      const {
        winningSlate: countWinner,
        winnerVotes: countWinnerVotes,
        losingSlate: countLoser,
        loserVotes: countLoserVotes,
      } = receipt.logs[1].args;

      const expectedWinner = '2';
      const expectedVotes = '1000';
      const expectedLoser = '1';
      const expectedLoserVotes = (900 + 99).toString();

      assert.strictEqual(countWinner.toString(), expectedWinner, 'Incorrect winner in runoff count');
      assert.strictEqual(countWinnerVotes.toString(), expectedVotes, 'Incorrect winning votes in runoff count');
      assert.strictEqual(countLoser.toString(), expectedLoser, 'Incorrect loser in runoff count');
      assert.strictEqual(countLoserVotes.toString(), expectedLoserVotes, 'Incorrect loser votes in runoff count');
    });

    it('should assign the slate with the lowest ID if the runoff ends in a tie', async () => {
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '400', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '600', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Runoff
      const receipt = await gatekeeper.countRunoffVotes(ballotID, GRANT);
      const {
        winningSlate, winnerVotes, losingSlate, loserVotes,
      } = receipt.logs[1].args;

      assert.strictEqual(winnerVotes.toString(), loserVotes.toString(), 'Runoff should end in a tie');
      assert.strictEqual(winningSlate.toString(), '1', 'Winner should have been the slate with the lower ID');
      assert.strictEqual(losingSlate.toString(), '2', 'Loser should have been the slate with the higher ID');
    });

    it('should revert if a runoff is not pending', async () => {
      // Run a straight-forward confidence vote
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await reveal(ballotID, gatekeeper, aliceReveal);
      await reveal(ballotID, gatekeeper, bobReveal);
      await reveal(ballotID, gatekeeper, carolReveal);

      // Advance past reveal period
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(status.toString(), ContestStatus.Finalized);

      // Runoff
      try {
        await gatekeeper.countRunoffVotes(ballotID, GRANT);
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Ran runoff even though none was pending');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('post-voting', () => {
    // before count
    // confidence
    // runoff
  });

  describe('getWinningSlate', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let snapshotID;

    const initialTokens = '20000000';
    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];


    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, capacitor, token } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
      await gatekeeper.stakeTokens(2, { from: recommender });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });
    });

    it('should correctly get the winning slate after a finalized confidence vote', async () => {
      await doConfidenceVote(gatekeeper, ballotID, [alice, bob, carol], { finalize: false });
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Check winner
      const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
      assert.strictEqual(winner.toString(), '0', 'Returned the wrong winner');
    });

    it('should correctly get the winning slate after a finalized runoff', async () => {
      await doRunoff(gatekeeper, ballotID, [alice, bob, carol], { finalize: false });
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Runoff
      await gatekeeper.countRunoffVotes(ballotID, GRANT);

      // Check winner
      const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
      assert.strictEqual(winner.toString(), '1', 'Returned the wrong winner');
    });

    it('should revert if the contest has not been finalized', async () => {
      try {
        await gatekeeper.getWinningSlate(ballotID, GRANT);
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Returned a winner even though the contest has not been finalized');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('hasPermission', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    const initialTokens = '20000000';
    let ballotID;
    let snapshotID;
    let GRANT;
    const grantProposals = [
      { to: recommender, tokens: '1000', metadataHash: createMultihash('grant') },
      { to: recommender, tokens: '1000', metadataHash: createMultihash('grant 2') },
      { to: recommender, tokens: '1000', metadataHash: createMultihash('grant 3') },
    ];


    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ token, gatekeeper, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      // contains requests 0, 1, 2
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      // contains requests 3, 4, 5
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      // contains requests 6, 7, 8
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
      await gatekeeper.stakeTokens(2, { from: recommender });
    });

    it('should return false for a request before votes are counted', async () => {
      const requestID = 0;
      const hasPermission = await gatekeeper.hasPermission.call(requestID);
      assert.strictEqual(hasPermission, false, 'Request should NOT be approved');
    });

    describe('simple vote', () => {
      beforeEach(async () => {
        // Run a simple vote
        await increaseTime(timing.VOTING_PERIOD_START);
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

        // Reveal all votes
        await increaseTime(timing.COMMIT_PERIOD_LENGTH);
        await reveal(ballotID, gatekeeper, aliceReveal);
        await reveal(ballotID, gatekeeper, bobReveal);
        await reveal(ballotID, gatekeeper, carolReveal);

        // Advance past reveal period
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);
        await gatekeeper.countVotes(ballotID, GRANT);
      });

      it('should return true for a request that was included in an accepted slate', async () => {
        const requestID = 0;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, true, 'Request should have been approved');
      });

      it('should return false for a request that was included in a rejected slate', async () => {
        const requestID = 3;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, false, 'Request should NOT have been approved');
      });

      it('should return false for an approved request that has expired', async () => {
        const requestID = 0;

        // Request is initially approved
        const initialPermission = await gatekeeper.hasPermission(requestID);
        assert.strictEqual(initialPermission, true, 'Request should have been approved');

        // Move forward
        await increaseTime(timing.EPOCH_LENGTH);
        const request = await gatekeeper.requests(requestID);
        const now = await utils.evm.timestamp();
        assert(now >= request.expirationTime, 'Not past expiration time');

        // Check expired request
        const hasPermission = await gatekeeper.hasPermission(requestID);
        assert.strictEqual(hasPermission, false, 'Expired request should not have been approved');
      });
    });

    describe('runoff', () => {
      beforeEach(async () => {
        // Run a vote that triggers a runoff
        await increaseTime(timing.VOTING_PERIOD_START);
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

        // Reveal all votes
        await increaseTime(timing.COMMIT_PERIOD_LENGTH);
        await reveal(ballotID, gatekeeper, aliceReveal);
        await reveal(ballotID, gatekeeper, bobReveal);
        await reveal(ballotID, gatekeeper, carolReveal);

        // Advance past reveal period
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);

        // Run -- slate 1 wins
        await gatekeeper.countVotes(ballotID, GRANT);
        await gatekeeper.countRunoffVotes(ballotID, GRANT);
      });

      it('should return true for a request that was included in an accepted slate', async () => {
        const requestID = 3;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, true, 'Request should have been approved');
      });

      it('should return false for a request that was included in a rejected slate', async () => {
        const requestID = 0;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, false, 'Request should NOT have been approved');
      });

      it('should return false for an approved request that has expired', async () => {
        const requestID = 3;

        // Request is initially approved
        const initialPermission = await gatekeeper.hasPermission(requestID);
        assert.strictEqual(initialPermission, true, 'Request should have been approved');

        // Move forward
        await increaseTime(timing.EPOCH_LENGTH);
        const request = await gatekeeper.requests(requestID);
        const now = await utils.evm.timestamp();
        assert(now >= request.expirationTime, 'Not past expiration time');

        // Check expired request
        const hasPermission = await gatekeeper.hasPermission(requestID);
        assert.strictEqual(hasPermission, false, 'Expired request should not have been approved');
      });
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('withdrawStake', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let stakeAmount;
    let snapshotID;

    const initialTokens = '20000000';
    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });


      const allocatedTokens = '10000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      stakeAmount = await parameters.getAsUint('slateStakeAmount');

      // Stake
      await gatekeeper.stakeTokens(0, { from: alice });
      await gatekeeper.stakeTokens(1, { from: carol });
      await gatekeeper.stakeTokens(2, { from: bob });
    });


    describe('confidence vote', () => {
      beforeEach(async () => {
        await increaseTime(timing.VOTING_PERIOD_START);
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

        // Reveal all votes
        await increaseTime(timing.COMMIT_PERIOD_LENGTH);
        await reveal(ballotID, gatekeeper, aliceReveal);
        await reveal(ballotID, gatekeeper, bobReveal);
        await reveal(ballotID, gatekeeper, carolReveal);

        // Advance past reveal period
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);
      });

      it('should withdraw tokens after a finalized confidence vote', async () => {
        // Confidence vote
        await gatekeeper.countVotes(ballotID, GRANT);

        // Get winner
        const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
        assert.strictEqual(winner.toString(), '0', 'Returned the wrong winner');

        const { staker } = await gatekeeper.slates(winner);

        // initial balances
        const initialBalance = await token.balanceOf(staker);
        const initialGatekeeperBalance = await token.balanceOf(gatekeeper.address);

        // Withdraw
        const receipt = await gatekeeper.withdrawStake(winner, { from: staker });
        // console.log(receipt);

        // Check logs
        assert.strictEqual(receipt.logs[0].event, 'StakeWithdrawn', 'Wrong event was emitted');

        const { slateID, staker: emittedStaker, numTokens } = receipt.logs[0].args;
        assert.strictEqual(slateID.toString(), winner.toString(), 'Emitted wrong slateID');
        assert.strictEqual(emittedStaker, staker, 'Emitted staker was wrong');
        assert.strictEqual(
          numTokens.toString(),
          stakeAmount.toString(),
          'Emitted numTokens was wrong',
        );

        // Tokens should have been transferred
        const expectedBalance = initialBalance.add(stakeAmount);
        const finalBalance = await token.balanceOf(staker);
        assert.strictEqual(
          expectedBalance.toString(),
          finalBalance.toString(),
          "Staker's final balance was incorrect",
        );

        const expectedGatekeeperBalance = initialGatekeeperBalance.sub(stakeAmount);
        const finalGatekeeperBalance = await token.balanceOf(gatekeeper.address);
        assert.strictEqual(
          expectedGatekeeperBalance.toString(),
          finalGatekeeperBalance.toString(),
          "Gatekeeper's final balance was incorrect",
        );
      });

      it('should revert if the slate has not been accepted', async () => {
        await gatekeeper.countVotes(ballotID, GRANT);

        // Get a rejected slate
        const loser = '1';
        const { staker } = await gatekeeper.slates(loser);

        try {
          await gatekeeper.withdrawStake(loser, { from: staker });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'has not been accepted');
          return;
        }
        assert.fail('Allowed withdrawal from a slate that has not been accepted');
      });

      it('should revert if the msg.sender is not the original staker', async () => {
        await gatekeeper.countVotes(ballotID, GRANT);

        // Get winner
        const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
        const { staker } = await gatekeeper.slates(winner);

        const badStaker = carol;
        assert(badStaker !== staker, 'Wrong staker');

        try {
          await gatekeeper.withdrawStake(winner, { from: badStaker });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'the original staker');
          return;
        }
        assert.fail('Allowed someone other than the original staker to withdraw the stake');
      });

      it('should revert if the stake has already been withdrawn', async () => {
        await gatekeeper.countVotes(ballotID, GRANT);

        // Get winner
        const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
        const { staker } = await gatekeeper.slates(winner);

        // Withdraw
        await gatekeeper.withdrawStake(winner, { from: staker });

        // Try to withdraw again
        try {
          await gatekeeper.withdrawStake(winner, { from: staker });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'already been withdrawn');
          return;
        }
        assert.fail('Allowed a stake to be withdrawn twice');
      });

      it('should revert if the slate is invalid', async () => {
        const slateID = '5000';

        try {
          await gatekeeper.withdrawStake(slateID, { from: alice });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'No slate exists');
          return;
        }
        assert.fail('Allowed withdrawal from a non-existent slate');
      });
    });

    describe('runoff vote', () => {
      beforeEach(async () => {
        // Run a vote that triggers a runoff
        await increaseTime(timing.VOTING_PERIOD_START);
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

        // Reveal all votes
        await increaseTime(timing.COMMIT_PERIOD_LENGTH);
        await reveal(ballotID, gatekeeper, aliceReveal);
        await reveal(ballotID, gatekeeper, bobReveal);
        await reveal(ballotID, gatekeeper, carolReveal);

        // Advance past reveal period
        await increaseTime(timing.REVEAL_PERIOD_LENGTH);

        // Run -- slate 1 wins
        await gatekeeper.countVotes(ballotID, GRANT);
        await gatekeeper.countRunoffVotes(ballotID, GRANT);
      });

      it('should withdraw tokens after a finalized runoff vote', async () => {
        // Get winner
        const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
        assert.strictEqual(winner.toString(), '1', 'Returned the wrong winner');

        const { staker } = await gatekeeper.slates(winner);

        // initial balances
        const initialBalance = await token.balanceOf(staker);
        const initialGatekeeperBalance = await token.balanceOf(gatekeeper.address);

        // Withdraw
        const receipt = await gatekeeper.withdrawStake(winner, { from: staker });
        // console.log(receipt);

        // Check logs
        assert.strictEqual(receipt.logs[0].event, 'StakeWithdrawn', 'Wrong event was emitted');

        const { slateID, staker: emittedStaker, numTokens } = receipt.logs[0].args;
        assert.strictEqual(slateID.toString(), winner.toString(), 'Emitted wrong slateID');
        assert.strictEqual(emittedStaker, staker, 'Emitted staker was wrong');
        assert.strictEqual(
          numTokens.toString(),
          stakeAmount.toString(),
          'Emitted numTokens was wrong',
        );

        // Tokens should have been transferred
        const expectedBalance = initialBalance.add(stakeAmount);
        const finalBalance = await token.balanceOf(staker);
        assert.strictEqual(
          expectedBalance.toString(),
          finalBalance.toString(),
          "Staker's final balance was incorrect",
        );

        const expectedGatekeeperBalance = initialGatekeeperBalance.sub(stakeAmount);
        const finalGatekeeperBalance = await token.balanceOf(gatekeeper.address);
        assert.strictEqual(
          expectedGatekeeperBalance.toString(),
          finalGatekeeperBalance.toString(),
          "Gatekeeper's final balance was incorrect",
        );
      });

      it('should revert if the slate has not been accepted', async () => {
        // Get a rejected slate
        const loser = '0';
        const { staker } = await gatekeeper.slates(loser);

        // Try to withdraw
        try {
          await gatekeeper.withdrawStake(loser, { from: staker });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'has not been accepted');
          return;
        }
        assert.fail('Allowed withdrawal from a slate that has not been accepted');
      });
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('donateChallengerStakes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let snapshotID;

    const initialTokens = '20000000';
    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // create simple ballot with just grants
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });

      const allocatedTokens = '10000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // Stake
      await gatekeeper.stakeTokens(0, { from: alice });
      await gatekeeper.stakeTokens(1, { from: carol });
      await gatekeeper.stakeTokens(2, { from: bob });
    });


    describe('confidence vote', () => {
      it('should send tokens to the capacitor after a finalized confidence vote', async () => {
        await doConfidenceVote(gatekeeper, ballotID, [alice, bob, carol]);

        // initial balances
        const initialTokenCapacitorBalance = await token.balanceOf(capacitor.address);
        const initialGatekeeperBalance = await token.balanceOf(gatekeeper.address);

        // get slates from the contest
        const slateIDs = await gatekeeper.contestSlates(ballotID, GRANT);

        const losingSlates = await utils.getLosingSlates(gatekeeper, slateIDs);
        const totalDonation = losingSlates.map(s => s.stake)
          .reduce((total, num) => total.add(num), new BN(0));

        // Donate tokens
        await gatekeeper.donateChallengerStakes(ballotID, GRANT, { from: creator });

        // Tokens should have been transferred
        const expectedTokenCapacitorBalance = initialTokenCapacitorBalance.add(totalDonation);
        const finalTokenCapacitorBalance = await token.balanceOf(capacitor.address);
        assert.strictEqual(
          expectedTokenCapacitorBalance.toString(),
          finalTokenCapacitorBalance.toString(),
          "Token capacitor's final balance was incorrect",
        );

        const expectedGatekeeperBalance = initialGatekeeperBalance.sub(totalDonation);
        const finalGatekeeperBalance = await token.balanceOf(gatekeeper.address);
        assert.strictEqual(
          expectedGatekeeperBalance.toString(),
          finalGatekeeperBalance.toString(),
          "Gatekeeper's final balance was incorrect",
        );

        // Slates should have zero stake
        const resultingSlates = await utils.getLosingSlates(gatekeeper, slateIDs);
        const remainingStake = resultingSlates.map(s => s.stake)
          .reduce((total, num) => total.add(num), new BN(0));
        assert.strictEqual(
          remainingStake.toString(),
          '0',
          'All of the losing stake should have been donated',
        );
      });

      it('should revert if the contest is not finalized', async () => {
        await doConfidenceVote(gatekeeper, ballotID, [alice, bob, carol], { finalize: false });

        // Try to donate
        try {
          await gatekeeper.donateChallengerStakes(ballotID, GRANT, { from: creator });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'not finalized');
          return;
        }
        assert.fail('Allowed donation of challenger stakes for an unfinalized contest');
      });
    });


    describe('runoff vote', () => {
      it('should send tokens to the capacitor after a finalized runoff', async () => {
        await doRunoff(gatekeeper, ballotID, [alice, bob, carol]);

        // initial balances
        const initialTokenCapacitorBalance = await token.balanceOf(capacitor.address);
        const initialGatekeeperBalance = await token.balanceOf(gatekeeper.address);

        // get slates from the contest
        const slateIDs = await gatekeeper.contestSlates(ballotID, GRANT);

        const losingSlates = await utils.getLosingSlates(gatekeeper, slateIDs);
        const totalDonation = losingSlates.map(s => s.stake)
          .reduce((total, num) => total.add(num), new BN(0));

        // Donate tokens
        await gatekeeper.donateChallengerStakes(ballotID, GRANT, { from: creator });

        // Tokens should have been transferred
        const expectedTokenCapacitorBalance = initialTokenCapacitorBalance.add(totalDonation);
        const finalTokenCapacitorBalance = await token.balanceOf(capacitor.address);
        assert.strictEqual(
          expectedTokenCapacitorBalance.toString(),
          finalTokenCapacitorBalance.toString(),
          "Token capacitor's final balance was incorrect",
        );

        const expectedGatekeeperBalance = initialGatekeeperBalance.sub(totalDonation);
        const finalGatekeeperBalance = await token.balanceOf(gatekeeper.address);
        assert.strictEqual(
          expectedGatekeeperBalance.toString(),
          finalGatekeeperBalance.toString(),
          "Gatekeeper's final balance was incorrect",
        );

        // Slates should have zero stake
        const resultingSlates = await utils.getLosingSlates(gatekeeper, slateIDs);
        const remainingStake = resultingSlates.map(s => s.stake)
          .reduce((total, num) => total.add(num), new BN(0));
        assert.strictEqual(
          remainingStake.toString(),
          '0',
          'All of the losing stake should have been donated',
        );
      });

      it('should revert if the contest is not finalized', async () => {
        await doRunoff(gatekeeper, ballotID, [alice, bob, carol], { finalize: false });

        // Try to donate
        try {
          await gatekeeper.donateChallengerStakes(ballotID, GRANT, { from: creator });
        } catch (error) {
          expectRevert(error);
          expectErrorLike(error, 'not finalized');
          return;
        }
        assert.fail('Allowed donation of challenger stakes for an unfinalized contest');
      });
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });

  describe('incumbent', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;
    let snapshotID;

    let ballotID;
    let GRANT;
    const grantProposals = [{
      to: recommender, tokens: '1000', metadataHash: createMultihash('grant'),
    }];

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      GRANT = await getResource(gatekeeper, 'GRANT');

      // create simple ballot with just grants
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('my slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('competing slate'),
      });

      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender,
        metadata: createMultihash('yet another slate'),
      });

      const allocatedTokens = '10000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // Stake
      await gatekeeper.stakeTokens(0, { from: alice });
      await gatekeeper.stakeTokens(1, { from: carol });
      await gatekeeper.stakeTokens(2, { from: bob });
    });

    it('should return the zero address if no contests have been finalized for the resource', async () => {
      const incumbent = await gatekeeper.incumbent(GRANT);
      assert.strictEqual(incumbent, utils.zeroAddress(), 'Initial incumbent should have been zero');
    });

    it('should return a new incumbent if someone else wins', async () => {
      // run simple vote
      await doConfidenceVote(gatekeeper, ballotID, [alice, bob, carol]);
      const previousIncumbent = await gatekeeper.incumbent(GRANT);
      const nextEpoch = await gatekeeper.currentEpochNumber();

      // move forward a couple epochs
      const offset = new BN(2);
      await increaseTime(timing.EPOCH_LENGTH.mul(offset));
      const epoch = await gatekeeper.currentEpochNumber();
      assert.strictEqual(epoch.toString(), nextEpoch.add(offset).toString(), 'Wrong epoch number');

      // finalize contest for another another epoch
      const slateID = await gatekeeper.slateCount();
      await utils.grantSlateFromProposals({
        gatekeeper,
        proposals: grantProposals,
        capacitor,
        recommender: alice,
        metadata: createMultihash('the best slate'),
      });
      const stake = '5000';
      await token.transfer(alice, stake, { from: creator });
      await token.approve(gatekeeper.address, stake, { from: alice });
      await gatekeeper.stakeTokens(slateID, { from: alice });

      const resource = await getResource(gatekeeper, 'GRANT');

      await increaseTime(timing.VOTING_PERIOD_START);
      await gatekeeper.countVotes(epoch, resource);

      // Check
      const incumbent = await gatekeeper.incumbent(GRANT);
      assert.strictEqual(incumbent, alice, 'Incumbent should be the winning slate recommender');
      assert.notStrictEqual(incumbent, previousIncumbent, 'Incumbent should have changed');
    });

    it('should maintain the incumbent even if no action takes place in an epoch', async () => {
      // run simple vote
      await doConfidenceVote(gatekeeper, ballotID, [alice, bob, carol]);
      const previousIncumbent = await gatekeeper.incumbent(GRANT);
      const nextEpoch = await gatekeeper.currentEpochNumber();

      // move forward a couple epochs
      const offset = new BN(2);
      await increaseTime(timing.EPOCH_LENGTH.mul(offset));
      const epoch = await gatekeeper.currentEpochNumber();
      assert.strictEqual(epoch.toString(), nextEpoch.add(offset).toString(), 'Wrong epoch number');

      // incumbent should be the same
      const incumbent = await gatekeeper.incumbent(GRANT);
      assert.strictEqual(incumbent, previousIncumbent, 'Incumbent should have stayed the same');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });
});
