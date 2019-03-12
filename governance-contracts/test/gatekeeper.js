/* eslint-env mocha */
/* global assert artifacts contract */

const utils = require('./utils');

const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');
const Slate = artifacts.require('Slate');
const BasicToken = artifacts.require('BasicToken');


const { expectRevert, newToken } = utils;


contract('Gatekeeper', (accounts) => {
  describe('constructor', () => {
    const [creator] = accounts;

    it('should correctly initialize the gatekeeper', async () => {
      const startTime = '6000';
      const stakeAmount = '5000';
      const token = await newToken({ from: creator });
      const gatekeeper = await Gatekeeper.new(
        token.address,
        startTime, stakeAmount, {
          from: creator,
        },
      );

      // Check initial values
      const actualToken = await gatekeeper.token({ from: creator });
      assert.strictEqual(actualToken.toString(), token.address);

      // start time
      const actualStartTime = await gatekeeper.startTime({ from: creator });
      assert.strictEqual(actualStartTime.toString(), startTime.toString());

      // batch length
      const batchLength = await gatekeeper.batchLength();
      const expected = 604800 * 13;
      assert.strictEqual(batchLength.toString(), expected.toString());

      // mutable parameters
      const ps = await gatekeeper.parameters();
      const parameters = await ParameterStore.at(ps);

      // stake amount
      const actualStakeAmount = await parameters.get('slateStakeAmount');
      assert.strictEqual(actualStakeAmount.toString(), stakeAmount.toString());
    });

    it('should fail if the token address is zero', async () => {
      const tokenAddress = utils.zeroAddress();

      const startTime = '6000';
      const stakeAmount = '5000';

      try {
        await Gatekeeper.new(
          tokenAddress,
          startTime, stakeAmount, {
            from: creator,
          },
        );
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

    it('should create a gatekeeper', async () => {
      const initialTokens = '10000000';
      const token = await utils.newToken({ initialTokens, from: creator });
      const gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const t = await gatekeeper.token();
      assert.strictEqual(t, token.address);
    });
  });

  describe('currentBatchNumber', () => {
    it('should correctly calculate the initial batch number');
    it('should correctly calculate a subsequent batch number');
  });

  describe('currentBatchStart', () => {
    it('should calculate the start of the initial batch as the start time');
    it('should correctly calculate the batch start time');
  });

  describe('recommendSlate', () => {
    const [creator, recommender] = accounts;
    let gatekeeper;
    let requestIDs;
    const metadataHash = utils.createMultihash('my slate');

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });
      requestIDs = [0, 1, 2, 3];
    });

    it('should create a new slate with the provided data', async () => {
      const batchNumber = 0;
      const category = 0;
      const receipt = await gatekeeper.recommendSlate(
        batchNumber,
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

      // Check that we can interact with the slate
      const slateAddress = await gatekeeper.slates(slateID);
      const newSlate = await Slate.at(slateAddress);
      assert.strictEqual(newSlate.address, slateAddress, 'Slate address is incorrect');
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

  describe('commitBallot', () => {
    const [creator, voter] = accounts;
    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

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
    const ballotID = 0;

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });

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
    const ballotID = 0;

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });

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
});
