/* eslint-env mocha */
/* global assert artifacts contract */

const utils = require('./utils');

const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');
const Slate = artifacts.require('Slate');
const BasicToken = artifacts.require('BasicToken');


const {
  expectRevert, newToken, voteSingle, revealVote: reveal, ContestStatus, SlateStatus,
} = utils;

const GRANT = 0;
const GOVERNANCE = 1;


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
    const batchNumber = 0;

    beforeEach(async () => {
      gatekeeper = await utils.newGatekeeper({ from: creator });

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

      // Adding a slate should set contest status to NoContest
      const status = await gatekeeper.contestStatus(batchNumber, category);
      assert.strictEqual(status.toString(), '1', 'Contest status should be NoContest (1)');
    });

    it('should revert if the metadataHash is empty', async () => {
      const category = GRANT;
      const emptyHash = '';

      try {
        await gatekeeper.recommendSlate(
          batchNumber,
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
          batchNumber,
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
          batchNumber,
          category,
          invalidRequestIDs,
          utils.asBytes(metadataHash),
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        assert(error.toString().includes('no duplicates'));
        return;
      }
      assert.fail('Recommended a slate with duplicate requestIDs');
    });

    it('should revert if the batchNumber is wrong');
    it('should revert if the category is invalid');
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


  describe('revealBallot', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    const ballotID = 0;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // New slates 0, 1
      // grant
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      // New slates 2, 3
      // governance
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['g', 'h', 'i'],
        slateData: 'competing slate',
      }, { from: recommender });

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

      assert.strictEqual(emittedBallotID.toString(), '0');
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

  describe('didReveal', () => {
    const [creator, recommender, voter, nonvoter] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';

    const ballotID = 0;
    let votes;
    let numTokens;
    let commitHash;
    let revealData;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(voter, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: voter });

      // grant - slates 0, 1
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      // governance - slates 2, 3
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['g', 'h', 'i'],
        slateData: 'competing slate',
      }, { from: recommender });

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
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });
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
        ContestStatus.VoteFinalized,
        'Contest status should have been VoteFinalized',
      );

      // Winning slate should have status Accepted
      const slateAddress = await gatekeeper.slates.call(winningSlate);
      const slate = await Slate.at(slateAddress);
      const slateStatus = await slate.status();
      assert.strictEqual(
        slateStatus.toString(),
        SlateStatus.Accepted,
        'Winning slate status should have been Accepted',
      );

      // All the other slates should have status Rejected
      const contestSlates = await gatekeeper.contestSlates.call(ballotID, GRANT);
      const statuses = await Promise.all(
        contestSlates.filter(s => s.toString() !== winningSlate.toString())
          .map(id => gatekeeper.slates.call(id)
            .then(address => Slate.at(address))
            .then(s => s.status.call())),
      );

      statuses.forEach((_status) => {
        assert.strictEqual(
          _status.toString(),
          SlateStatus.Rejected,
          'Non-winning slate should have status Rejected',
        );
      });

      // requests in the slate should all return true for hasPermission
      const slateRequests = await slate.getRequests.call();
      const permissions = await Promise.all(slateRequests.map(r => gatekeeper.hasPermission(r)));
      permissions.forEach((has) => {
        assert.strictEqual(has, true, 'Request should have permission');
      });
    });

    it('should revert if the category has no slates', async () => {
      // Governance has no slates, not in progress
      try {
        await gatekeeper.countVotes(ballotID, GOVERNANCE);
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Tallied votes for category with no slates');
    });

    it('should revert if the category has only one slate', async () => {
      // Add a new governance slate
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GOVERNANCE,
        proposalData: ['e', 'f', 'g'],
        slateData: 'governance slate',
      }, { from: recommender });

      // Try to count
      try {
        await gatekeeper.countVotes(ballotID, GOVERNANCE);
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Tallied votes for a category with no competition');
    });

    it('should wait for a runoff if no slate has more than 50% of the votes', async () => {
      // Add a third slate
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
      assert.strictEqual(receipt.logs.length, 1, 'Only one event should have been emitted');

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
      assert.strictEqual(receipt.logs.length, 1, 'Only one event should have been emitted');

      // Should be waiting for a runoff
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.RunoffPending,
        'Contest status should have been RunoffPending',
      );
    });
  });

  describe('getFirstChoiceVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    const initialTokens = '20000000';
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['e', 'f', 'g'],
        slateData: 'competing slate',
      }, { from: recommender });
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
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
    });

    it('should return Empty if the category has no slates', async () => {
      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.Empty,
        'Contest status should have been Empty',
      );
    });

    it('should return NoContest if the category has only a single slate', async () => {
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.NoContest,
        'Contest status should have been NoContest',
      );
    });

    it('should return Started if the category has two or more slates', async () => {
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });


      const status = await gatekeeper.contestStatus(ballotID, GRANT);

      assert.strictEqual(
        status.toString(),
        ContestStatus.Started,
        'Contest status should have been Started',
      );
    });

    // VoteFinalized, RunoffComplete
  });

  describe('countRunoffVotes', () => {
    const [creator, recommender, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;

    const initialTokens = '20000000';
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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

      // status should be RunoffFinalized at the end
      const status = await gatekeeper.contestStatus(ballotID, GRANT);
      assert.strictEqual(
        status.toString(),
        ContestStatus.RunoffFinalized,
        'Contest status should have been RunoffFinalized',
      );

      // Winning slate should have status Accepted
      const slateAddress = await gatekeeper.slates.call(winningSlate);
      const slate = await Slate.at(slateAddress);
      const slateStatus = await slate.status();
      assert.strictEqual(
        slateStatus.toString(),
        SlateStatus.Accepted,
        'Winning slate status should have been Accepted',
      );

      // All the other slates should have status Rejected
      const contestSlates = await gatekeeper.contestSlates.call(ballotID, GRANT);
      const statuses = await Promise.all(
        contestSlates.filter(s => s.toString() !== winningSlate.toString())
          .map(id => gatekeeper.slates.call(id)
            .then(address => Slate.at(address))
            .then(s => s.status.call())),
      );

      statuses.forEach((_status) => {
        assert.strictEqual(
          _status.toString(),
          SlateStatus.Rejected,
          'Non-winning slate should have status Rejected',
        );
      });

      // requests in the slate should all return true for hasPermission
      const slateRequests = await slate.getRequests.call();
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
      assert.strictEqual(status.toString(), ContestStatus.VoteFinalized);

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
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      // create simple ballot with just grants
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['h', 'i', 'j'],
        slateData: 'yet another slate',
      }, { from: recommender });

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
    const ballotID = 0;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });

      const allocatedTokens = '1000';

      // Make sure the voter has available tokens and the gatekeeper is approved to spend them
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });

      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });

      await token.transfer(carol, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // create simple ballot with just grants
      // contains requests 0, 1, 2
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'c'],
        slateData: 'my slate',
      }, { from: recommender });

      // contains requests 3, 4, 5
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['a', 'b', 'd'],
        slateData: 'competing slate',
      }, { from: recommender });

      // contains requests 6, 7, 8
      await utils.newSlate(gatekeeper, {
        batchNumber: ballotID,
        category: GRANT,
        proposalData: ['e', 'f', 'g'],
        slateData: 'competing slate',
      }, { from: recommender });
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
});
