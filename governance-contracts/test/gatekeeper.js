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
} = utils;

const { increaseTime } = utils.evm;

const { GRANT, GOVERNANCE } = utils.categories;

const ONE_WEEK = new BN('604800');

const timing = {
  EPOCH_LENGTH: ONE_WEEK.mul(new BN(13)),
  VOTING_PERIOD_START: ONE_WEEK.mul(new BN(11)),
  COMMIT_PERIOD_LENGTH: ONE_WEEK.mul(new BN(2)),
  REVEAL_PERIOD_LENGTH: ONE_WEEK.mul(new BN(2)),
};


async function doRunoff(gatekeeper, ballotID, voters, options) {
  const { finalize = true } = options || {};
  const [alice, bob, carol] = voters;

  // Run a vote that triggers a runoff
  const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
  const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
  const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

  // Reveal all votes
  await reveal(gatekeeper, aliceReveal);
  await reveal(gatekeeper, bobReveal);
  await reveal(gatekeeper, carolReveal);

  // Run -- slate 1 wins
  if (finalize) {
    await gatekeeper.countVotes(ballotID, GRANT);
    await gatekeeper.countRunoffVotes(ballotID, GRANT);
  }
}

async function doConfidenceVote(gatekeeper, ballotID, voters, options) {
  const { finalize = true } = options || {};
  const [alice, bob, carol] = voters;

  const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
  const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
  const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

  // Reveal all votes
  await reveal(gatekeeper, aliceReveal);
  await reveal(gatekeeper, bobReveal);
  await reveal(gatekeeper, carolReveal);

  // Run - slate 0 wins
  if (finalize) {
    await gatekeeper.countVotes(ballotID, GRANT);
  }
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
      const epochLength = await gatekeeper.epochLength();
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
        const epochStart = await gatekeeper.currentEpochStart();
        assert.strictEqual(
          epochStart.toString(),
          expected.toString(),
          'Initial epoch start should have been equal to system start time',
        );
      });
      it('should initialize the slate submission deadline', async () => {
        const slateSubmissionDeadline = await gatekeeper.slateSubmissionDeadline(GRANT);
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
        const epochStart = await gatekeeper.currentEpochStart();
        const epochLength = await gatekeeper.epochLength();
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
        const epochStart = await gatekeeper.currentEpochStart();
        const slateSubmissionDeadline = await gatekeeper.slateSubmissionDeadline(GRANT);
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
  });

  describe('recommendSlate', () => {
    const [creator, recommender] = accounts;
    let gatekeeper;
    let requestIDs;
    const metadataHash = utils.createMultihash('my slate');
    let batchNumber;

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });
      batchNumber = await gatekeeper.currentEpochNumber();

      // Get requestIDs for the slate
      requestIDs = await utils.getRequestIDs(gatekeeper, [
        'proposal1',
        'proposal2',
        'proposal3',
        'proposal4',
      ], { from: recommender });
    });

    it('should create a new slate with the provided data', async () => {
      const category = GRANT;

      // Initial status should be Empty
      const initialStatus = await gatekeeper.contestStatus(batchNumber, category);
      assert.strictEqual(initialStatus.toString(), '0', 'Initial contest status should be Empty (0)');

      // Create a slate
      const receipt = await gatekeeper.recommendSlate(
        category,
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
      assert.strictEqual(slate.epochNumber.toString(), batchNumber.toString(), 'Incorrect epoch number');
      assert.strictEqual(slate.categoryID.toString(), category.toString(), 'Incorrect category');

      // Adding a slate without staking it should not change the contest status
      const status = await gatekeeper.contestStatus(batchNumber, category);
      assert.strictEqual(status.toString(), ContestStatus.Empty, 'Contest status should be Empty (0)');
    });

    it('should allow creation of an empty slate', async () => {
      const category = GRANT;
      const noRequests = [];

      // Create a slate
      const receipt = await gatekeeper.recommendSlate(
        category,
        noRequests,
        utils.asBytes(metadataHash),
        { from: recommender },
      );

      const { slateID } = receipt.logs[0].args;
      const requests = await gatekeeper.slateRequests(slateID);
      assert.deepStrictEqual(requests, noRequests);
    });

    it('should revert if the metadataHash is empty', async () => {
      const category = GRANT;
      const emptyHash = '';

      try {
        await gatekeeper.recommendSlate(
          category,
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
      const category = GRANT;
      const invalidRequestIDs = [...requestIDs, requestIDs.length];

      try {
        await gatekeeper.recommendSlate(
          category,
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
      const category = GRANT;
      const invalidRequestIDs = [...requestIDs, requestIDs[0]];

      try {
        await gatekeeper.recommendSlate(
          category,
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

    it('should revert if the category is invalid');

    describe('after submission deadline', () => {
      let snapshotID;

      beforeEach(async () => {
        snapshotID = await utils.evm.snapshot();
      });

      it('should revert if the slate submission period is not active', async () => {
        const category = GRANT;
        const deadline = await gatekeeper.slateSubmissionDeadline(category);

        // move forward
        const offset = ONE_WEEK.mul(new BN(6));
        await increaseTime(offset);
        const now = await utils.evm.timestamp();
        const submissionTime = new BN(now);
        assert(submissionTime.gt(deadline), 'Time is not after deadline');

        try {
          await gatekeeper.recommendSlate(category, requestIDs, utils.asBytes(metadataHash), {
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
    let token;
    const initialTokens = '20000000';

    const batchNumber = 0;
    const slateID = 0;
    let stakeAmount;
    let snapshotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      snapshotID = await utils.evm.snapshot();

      await utils.newSlate(gatekeeper, {
        batchNumber,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'grant slate',
      }, { from: recommender });

      stakeAmount = await parameters.getAsUint('slateStakeAmount');

      // Give out tokens
      const allocatedTokens = stakeAmount.add(new BN('1000'));
      await token.transfer(staker, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: staker });
    });

    it('should allow a user to stake tokens on a slate', async () => {
      const votingLength = timing.VOTING_PERIOD_START;

      const epochStart = await gatekeeper.currentEpochStart();
      // const epochNumber = await gatekeeper.currentEpochNumber();
      // console.log('epoch', epochNumber.toString());
      // console.log('start', printDate(epochStart));

      // move forward in the slate submission period
      const offset = ONE_WEEK;
      await increaseTime(offset);

      // Stake tokens
      const initialBalance = await token.balanceOf(staker);
      const receipt = await gatekeeper.stakeTokens(slateID, { from: staker });
      const { blockNumber: stakingBlock } = receipt.receipt;
      const stakingTime = new BN(await utils.evm.timestamp(stakingBlock));
      // console.log('stake', printDate(stakingTime));
      // console.log('WEEK', await utils.epochTime(gatekeeper, stakingTime));

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
      const finalSlateDeadline = await gatekeeper.slateSubmissionDeadline(GRANT);

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
      const category = GRANT;
      const deadline = await gatekeeper.slateSubmissionDeadline(category);

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
      const { requestID, metadataHash: emittedHash } = receipt.logs[0].args;
      // console.log(emittedHash, metadataHash);
      assert.strictEqual(decode(emittedHash), metadataHash, 'Metadata hash is incorrect');

      // Check Request
      const { metadataHash: requestHash, approved } = await gatekeeper.requests(requestID);
      assert.strictEqual(decode(requestHash), metadataHash, 'Metadata hash is incorrect');
      assert.strictEqual(approved, false);

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
  });

  describe('commitBallot', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
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

      const receipt = await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

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

      // Do not deposit any vote tokens, but commit anyway
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

      // Voter's token balance has increased
      const finalVotingBalance = await gatekeeper.voteTokenBalance(voter);
      assert.strictEqual(finalVotingBalance.toString(), numTokens);

      // Correctly store commitment
      const storedCommitHash = await gatekeeper.getCommitHash(ballotID, voter);
      assert.strictEqual(utils.stripHexPrefix(storedCommitHash.toString()), commitHash.toString('hex'), 'Stored commit hash is wrong');
    });

    it('should fail if the commit period is not active');

    it('should fail if the voter has already committed for this ballot', async () => {
      const commitHash = utils.keccak('data');
      const numTokens = '1000';

      // commit
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

      // try to commit again
      try {
        await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Committed a ballot more than once');
    });

    it('should fail if commit hash is zero', async () => {
      const commitHash = utils.zeroHash();
      const numTokens = '1000';

      try {
        await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Committed a ballot with a zero commit hash');
    });
  });

  describe('didCommit', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let ballotID;

    beforeEach(async () => {
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

      // commit
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

      const didCommit = await gatekeeper.didCommit(ballotID, voter);
      assert(didCommit, 'Voter committed, but didCommit returned false');
    });

    it('should return false if the voter has not committed for the ballot', async () => {
      const didCommit = await gatekeeper.didCommit(ballotID, voter);
      assert.strictEqual(didCommit, false, 'Voter did not commit, but didCommit returned true');
    });
  });

  describe('getCommitHash', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let ballotID;

    beforeEach(async () => {
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

      // commit
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

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
        return;
      }
      assert.fail('Voter did not commit for the given ballot');
    });
  });


  describe('revealBallot', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    let ballotID;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // New slates 2, 3
      // governance
      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['g', 'h', 'i'],
        slateData: 'competing slate',
      }, { from: recommender });

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
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

      // set up reveal data
      const categories = Object.keys(votes);
      const firstChoices = categories.map(cat => votes[cat].firstChoice);
      const secondChoices = categories.map(cat => votes[cat].secondChoice);

      revealData = {
        categories,
        firstChoices,
        secondChoices,
        salt,
      };
    });

    it('should successfully reveal a ballot', async () => {
      // didReveal should be false
      const initialDidReveal = await gatekeeper.didReveal(ballotID, voter);
      assert.strictEqual(initialDidReveal, false, 'didReveal should have been false before reveal');

      // Reveal
      const {
        categories, firstChoices, secondChoices, salt,
      } = revealData;

      const receipt = await gatekeeper.revealBallot(
        voter,
        categories,
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
      const { categories, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      try {
        await gatekeeper.revealBallot(
          voter,
          categories,
          firstChoices,
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('ballot does not match commitment'));
        return;
      }
      assert.fail('Revealed ballot with different data from what was committed');
    });

    // Inputs
    it('should fail if the supplied voter address is zero', async () => {
      const badVoter = utils.zeroAddress();

      // Reveal
      const {
        categories, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          badVoter,
          categories,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Voter address cannot be zero'));
        return;
      }
      assert.fail('Revealed with zero address');
    });

    it('should fail if the number of categories does not match', async () => {
      const { categories, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      try {
        await gatekeeper.revealBallot(
          voter,
          categories.slice(0, 1),
          firstChoices,
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('inputs must have the same length'));
        return;
      }
      assert.fail('Revealed ballot with wrong number of categories');
    });

    it('should fail if the number of firstChoices does not match', async () => {
      const { categories, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      try {
        await gatekeeper.revealBallot(
          voter,
          categories,
          firstChoices.slice(0, 1),
          secondChoices,
          salt,
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('inputs must have the same length'));
        return;
      }
      assert.fail('Revealed ballot with wrong number of firstChoices');
    });

    it('should fail if the number of secondChoices does not match', async () => {
      const { categories, firstChoices, secondChoices } = revealData;
      const salt = '9999';

      try {
        await gatekeeper.revealBallot(
          voter,
          categories,
          firstChoices,
          secondChoices.slice(0, 1),
          salt,
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('inputs must have the same length'));
        return;
      }
      assert.fail('Revealed ballot with wrong number of secondChoices');
    });

    it('should fail if any of the choices do not correspond to valid slates');
    it('should fail if any of the categories are invalid');

    // State
    it('should fail if the voter has not committed for the ballot', async () => {
      // Reveal for a non-voter
      const {
        categories, firstChoices, secondChoices, salt,
      } = revealData;

      try {
        await gatekeeper.revealBallot(
          nonvoter,
          categories,
          firstChoices,
          secondChoices,
          salt,
          { from: nonvoter },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Voter has not committed'));
        return;
      }
      assert.fail('Revealed for a voter who has not committed for the ballot');
    });

    it('should fail if the voter has already revealed for the ballot', async () => {
      // Reveal
      const {
        categories, firstChoices, secondChoices, salt,
      } = revealData;

      await gatekeeper.revealBallot(
        voter,
        categories,
        firstChoices,
        secondChoices,
        salt,
        { from: voter },
      );

      try {
        await gatekeeper.revealBallot(
          voter,
          categories,
          firstChoices,
          secondChoices,
          salt,
          { from: voter },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('Voter has already revealed'));
        return;
      }
      assert.fail('Revealed for a voter who has already revealed for the ballot');
    });

    it('should fail if the reveal period has not started');
    it('should fail if the reveal period has ended');
  });

  describe('revealManyBallots', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // Set up ballot
      // New slates 0, 1
      // grant
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'grant slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // New slates 2, 3
      // governance
      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['g', 'h', 'i'],
        slateData: 'competing slate',
      }, { from: recommender });

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
      const [aliceSalt, bobSalt, carolSalt] = ['1234', '5678', '9012'];

      const aliceReveal = await commitBallot(gatekeeper, alice, [[GRANT, 0, 1], [GOVERNANCE, 2, 3]], '1000', aliceSalt);
      const bobReveal = await commitBallot(gatekeeper, bob, [[GRANT, 0, 1], [GOVERNANCE, 2, 3]], '1000', bobSalt);
      const carolReveal = await commitBallot(gatekeeper, carol, [[GRANT, 1, 0], [GOVERNANCE, 2, 3]], '1000', carolSalt);

      // Prepare data
      const voters = [alice, bob, carol];
      const ballots = [aliceReveal, bobReveal, carolReveal].map(_reveal => utils.encodeBallot(
        _reveal.categories,
        _reveal.firstChoices,
        _reveal.secondChoices,
      ));
      const salts = [aliceSalt, bobSalt, carolSalt];

      // Reveal
      const receipt = await gatekeeper.revealManyBallots(voters, ballots, salts);

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
  });

  describe('didReveal', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    let ballotID;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // grant - slates 0, 1
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });

      // governance - slates 2, 3
      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['g', 'h', 'i'],
        slateData: 'competing slate',
      }, { from: recommender });

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

      // commit
      await gatekeeper.commitBallot(commitHash, numTokens, { from: voter });

      // set up reveal data
      const categories = Object.keys(votes);
      const firstChoices = categories.map(cat => votes[cat].firstChoice);
      const secondChoices = categories.map(cat => votes[cat].secondChoice);

      revealData = {
        categories,
        firstChoices,
        secondChoices,
        salt,
      };
    });

    it('should return true if the voter has revealed for the ballot', async () => {
      const {
        categories, firstChoices, secondChoices, salt,
      } = revealData;

      await gatekeeper.revealBallot(
        voter,
        categories,
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
  });

  describe('countVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
    });

    it('should correctly tally the votes and finalize a confidence vote', async () => {
      // basic confidence vote
      // slate 0 should win

      // Commit for voters
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
        categoryID: categoryID0,
        winningSlate: emittedWinner,
        votes: emittedWinnerVotes,
        totalVotes: emittedTotal,
      } = receipt.logs[0].args;

      assert.strictEqual(ballotID0.toString(), ballotID.toString(), 'Emitted ballotID did not match');
      assert.strictEqual(categoryID0.toString(), GRANT.toString(), 'Emitted categoryID did not match');
      assert.strictEqual(emittedWinner.toString(), '0', 'Slate 0 should have won');
      assert.strictEqual(emittedWinnerVotes.toString(), '2000', 'Winner had the wrong number of votes');
      assert.strictEqual(emittedTotal.toString(), '3000', 'Total vote count was wrong');

      // ConfidenceVoteFinalized
      assert.strictEqual(receipt.logs[1].event, 'ConfidenceVoteFinalized');
      const {
        ballotID: ballotID1,
        categoryID: categoryID1,
        winningSlate,
      } = receipt.logs[1].args;

      assert.strictEqual(ballotID1.toString(), ballotID.toString(), 'Emitted ballotID did not match');
      assert.strictEqual(categoryID1.toString(), GRANT.toString(), 'Emitted categoryID did not match');
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
    });

    it('should revert if the category has no staked slates', async () => {
      // Add a new governance slate, but don't stake
      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      // Governance has no staked slates, not in progress
      try {
        await gatekeeper.countVotes(ballotID, GOVERNANCE);
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Tallied votes for category with no staked slates');
    });

    it('should declare a slate as the winner if it is the only staked slate in the category', async () => {
      const slateID = await gatekeeper.slateCount();

      // Add a new governance slate
      await utils.newSlate(gatekeeper, {
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });
      await gatekeeper.stakeTokens(slateID, { from: recommender });

      // status: NoContest
      const initialStatus = await gatekeeper.contestStatus(ballotID, GOVERNANCE);
      assert.strictEqual(
        initialStatus.toString(),
        ContestStatus.NoContest,
        'Contest status should have been NoContest',
      );

      const receipt = await gatekeeper.countVotes(ballotID, GOVERNANCE);

      // Check events
      assert.strictEqual(receipt.logs[0].event, 'ContestAutomaticallyFinalized');
      const {
        ballotID: emittedBallotID,
        categoryID: emittedCategoryID,
        winningSlate: emittedWinner,
      } = receipt.logs[0].args;
      assert.strictEqual(emittedBallotID.toString(), ballotID.toString(), 'Wrong ballotID emitted');
      assert.strictEqual(emittedCategoryID.toString(), GOVERNANCE.toString(), 'Wrong categoryID emitted');
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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['x', 'y', 'z'],
        slateData: 'an unstaked slate',
      }, { from: recommender });

      // David votes for it with lots of power
      const david = accounts[5];
      const manyTokens = '10000';
      await token.transfer(david, manyTokens, { from: creator });
      await token.approve(gatekeeper.address, manyTokens, { from: david });

      // Commit for voters
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');
      const davidReveal = await voteSingle(gatekeeper, david, GRANT, 2, 1, manyTokens, '1337');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);
      await reveal(gatekeeper, davidReveal);

      // Finalize
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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });
      await gatekeeper.stakeTokens(slateID, { from: recommender });

      // Split the votes among the three slates
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 1, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '500', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '500', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
  });

  describe('getFirstChoiceVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['e', 'f', 'g'],
        slateData: 'competing slate',
      }, { from: recommender });

      await gatekeeper.stakeTokens(0, { from: recommender });
      await gatekeeper.stakeTokens(1, { from: recommender });
      await gatekeeper.stakeTokens(2, { from: recommender });
    });

    it('should correctly get the number of first choice votes for a slate', async () => {
      // Commit for voters
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

      // expect 2000, 1000, 0
      const slate0Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 0);
      assert.strictEqual(slate0Votes.toString(), '2000');
      const slate1Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 1);
      assert.strictEqual(slate1Votes.toString(), '1000');
      const slate2Votes = await gatekeeper.getFirstChoiceVotes(ballotID, GRANT, 2);
      assert.strictEqual(slate2Votes.toString(), '0');
    });
  });

  describe('contestStatus', () => {
    const [creator, recommender] = accounts;

    let gatekeeper;
    let token;

    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });
    });

    it('should return Empty if the category has no staked slates', async () => {
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.Empty,
        'Contest status should have been Empty',
      );
    });

    it('should return NoContest if the category has only a single staked slate', async () => {
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['d', 'e', 'f'],
        slateData: 'another slate',
      }, { from: recommender });

      // Only stake on one
      await gatekeeper.stakeTokens(0, { from: recommender });

      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.NoContest,
        'Contest status should have been NoContest',
      );
    });

    it('should return Active if the category has two or more staked slates', async () => {
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

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

    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
    });

    it('should count correctly if the original leader wins the runoff', async () => {
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '99', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '400', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '600', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
  });

  describe('getWinningSlate', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;

    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

      // Confidence vote
      await gatekeeper.countVotes(ballotID, GRANT);

      // Check winner
      const winner = await gatekeeper.getWinningSlate(ballotID, GRANT);
      assert.strictEqual(winner.toString(), '0', 'Returned the wrong winner');
    });

    it('should correctly get the winning slate after a finalized runoff', async () => {
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

      // Reveal all votes
      await reveal(gatekeeper, aliceReveal);
      await reveal(gatekeeper, bobReveal);
      await reveal(gatekeeper, carolReveal);

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
  });

  describe('hasPermission', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

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
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      // contains requests 3, 4, 5
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      // contains requests 6, 7, 8
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['e', 'f', 'g'],
        slateData: 'competing slate',
      }, { from: recommender });

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
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

        // Reveal all votes
        await reveal(gatekeeper, aliceReveal);
        await reveal(gatekeeper, bobReveal);
        await reveal(gatekeeper, carolReveal);
      });

      it('should return true for a request that was included in an accepted slate', async () => {
        await gatekeeper.countVotes(ballotID, GRANT);

        const requestID = 0;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, true, 'Request should have been approved');
      });

      it('should return false for a request that was included in a rejected slate', async () => {
        await gatekeeper.countVotes(ballotID, GRANT);

        const requestID = 3;
        const hasPermission = await gatekeeper.hasPermission.call(requestID);
        assert.strictEqual(hasPermission, false, 'Request should NOT have been approved');
      });
    });

    describe('runoff', () => {
      beforeEach(async () => {
        // Run a vote that triggers a runoff
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

        // Reveal all votes
        await reveal(gatekeeper, aliceReveal);
        await reveal(gatekeeper, bobReveal);
        await reveal(gatekeeper, carolReveal);

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
    });
  });

  describe('withdrawStake', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let stakeAmount;

    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      ballotID = await gatekeeper.currentEpochNumber();

      // Make sure the recommender has tokens
      const recommenderTokens = '50000';
      await token.transfer(recommender, recommenderTokens, { from: creator });
      await token.approve(gatekeeper.address, recommenderTokens, { from: recommender });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

        // Reveal all votes
        await reveal(gatekeeper, aliceReveal);
        await reveal(gatekeeper, bobReveal);
        await reveal(gatekeeper, carolReveal);
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
        const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '800', '1234');
        const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 1, 2, '900', '5678');
        const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 2, 0, '1000', '9012');

        // Reveal all votes
        await reveal(gatekeeper, aliceReveal);
        await reveal(gatekeeper, bobReveal);
        await reveal(gatekeeper, carolReveal);

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
  });

  describe('donateChallengerStakes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;

    const initialTokens = '20000000';
    let ballotID;

    beforeEach(async () => {
      ({ gatekeeper, token, capacitor } = await utils.newPanvala({ initialTokens, from: creator }));
      ballotID = await gatekeeper.currentEpochNumber();

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
  });
});
