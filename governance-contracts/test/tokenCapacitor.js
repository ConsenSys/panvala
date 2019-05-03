/* eslint-env mocha */
/* global assert artifacts contract */

const utils = require('./utils');

const TokenCapacitor = artifacts.require('TokenCapacitor');

const {
  expectRevert, expectErrorLike, voteSingle, revealVote, grantSlateFromProposals, BN,
} = utils;
const { GRANT } = utils.categories;


contract('TokenCapacitor', (accounts) => {
  describe('constructor', () => {
    const [creator] = accounts;
    let gatekeeper;

    beforeEach(async () => {
      // deploy a gatekeeper
      gatekeeper = await utils.newGatekeeper({ from: creator });
    });

    it('should correctly initialize the capacitor', async () => {
      // deploy a new capacitor
      const capacitor = await TokenCapacitor.new(gatekeeper.address, { from: creator });

      // Gatekeeper was connected
      const connectedGatekeeper = await capacitor.gatekeeper();
      assert.strictEqual(connectedGatekeeper, gatekeeper.address);

      // no proposals yet
      const proposalCount = await capacitor.proposalCount();
      assert.strictEqual(proposalCount.toString(), '0', 'There should be no proposals yet');
    });
  });

  describe('createProposal', () => {
    const [creator, beneficiary] = accounts;
    let gatekeeper;
    let capacitor;

    beforeEach(async () => {
      // deploy a gatekeeper
      gatekeeper = await utils.newGatekeeper({ from: creator });
      // deploy a new capacitor
      capacitor = await TokenCapacitor.new(gatekeeper.address, { from: creator });
    });

    it('should create a proposal to the appropriate beneficiary', async () => {
      const to = beneficiary;
      const tokens = '1000';
      const metadataHash = utils.createMultihash('my request data');

      const receipt = await capacitor.createProposal(
        to,
        tokens,
        utils.asBytes(metadataHash),
        { from: creator },
      );

      const {
        proposer,
        requestID,
        to: emittedRecipient,
        tokens: emittedTokens,
        metadataHash: emittedHash,
      } = receipt.logs[0].args;

      // should emit event with requestID and other data
      assert.strictEqual(requestID.toString(), '0');
      assert.strictEqual(proposer, creator, 'Emitted wrong proposer');
      assert.strictEqual(emittedRecipient, to, 'Emitted wrong beneficiary');
      assert.strictEqual(emittedTokens.toString(), tokens, 'Emitted wrong number of tokens');
      assert.strictEqual(
        utils.bytesAsString(emittedHash),
        metadataHash,
        'Emitted wrong metadataHash',
      );

      // should increment proposalCount
      const proposalCount = await capacitor.proposalCount();
      assert.strictEqual(proposalCount.toString(), '1', 'Should have incremented proposalCount');

      // should save proposal with values
      const proposal = await capacitor.proposals(requestID);
      assert.strictEqual(proposal.tokens.toString(), tokens, 'Proposal has wrong number of tokens');
      assert.strictEqual(proposal.to, to, 'Proposal has wrong beneficiary');
      assert.strictEqual(
        utils.bytesAsString(proposal.metadataHash),
        metadataHash,
        'Proposal has wrong metadataHash',
      );
      // proposal should not be marked as withdrawn
      assert.strictEqual(proposal.withdrawn, false, 'Proposal should not be withdrawn');
    });

    it('should allow a proposal to send to the zero address', async () => {
      const to = utils.zeroAddress();
      const tokens = '1000';
      const metadataHash = utils.createMultihash('my request data');

      await capacitor.createProposal(
        to,
        tokens,
        utils.asBytes(metadataHash),
        { from: creator },
      );
    });

    // rejection criteria:
    it('should not allow creation of a proposal with an empty metadataHash', async () => {
      const to = beneficiary;
      const tokens = '1000';
      const emptyHash = '';

      try {
        await capacitor.createProposal(
          to,
          tokens,
          utils.asBytes(emptyHash),
          { from: creator },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed creation of a proposal with an empty metadataHash');
    });
  });

  describe('createManyProposals', () => {
    const [creator, proposer, beneficiary1, beneficiary2] = accounts;
    let gatekeeper;
    let capacitor;

    beforeEach(async () => {
      // deploy a gatekeeper
      gatekeeper = await utils.newGatekeeper({ from: creator });
      // deploy a new capacitor
      capacitor = await TokenCapacitor.new(gatekeeper.address, { from: creator });
    });

    it('should create proposals and emit an event for each', async () => {
      const beneficiaries = [beneficiary1, beneficiary2];
      const tokenAmounts = ['1000', '2000'];
      const metadataHashes = ['request1', 'request2'].map(r => utils.createMultihash(r));

      const receipt = await capacitor.createManyProposals(
        beneficiaries,
        tokenAmounts,
        metadataHashes.map(utils.asBytes),
        { from: proposer },
      );

      assert.strictEqual(receipt.logs.length, beneficiaries.length, 'Wrong number of events');

      // eslint-disable-next-line
      for (let i = 0; i < beneficiaries.length; i++) {
        const log = receipt.logs[i];
        const to = beneficiaries[i];
        const tokens = tokenAmounts[i];
        const metadataHash = metadataHashes[i];

        const {
          proposer: emittedProposer,
          requestID,
          to: emittedRecipient,
          tokens: emittedTokens,
          metadataHash: emittedHash,
        } = log.args;

        // should emit event with requestID and other data
        const index = i.toString();
        assert.strictEqual(requestID.toString(), index);
        assert.strictEqual(emittedProposer, proposer, 'Emitted wrong proposer');
        assert.strictEqual(emittedRecipient, to, 'Emitted wrong beneficiary');
        assert.strictEqual(emittedTokens.toString(), tokens, 'Emitted wrong number of tokens');
        assert.strictEqual(
          utils.bytesAsString(emittedHash),
          metadataHash,
          'Emitted wrong metadataHash',
        );
      }
    });
  });

  describe('withdrawTokens', () => {
    const [creator, recommender1, recommender2, alice, bob, carol] = accounts;

    let gatekeeper;
    let token;
    let capacitor;

    const initialTokens = '100000000';
    const capacitorSupply = '50000000';
    const ballotID = 0;

    let proposals1;
    let proposals2;
    let winningSlate;
    let approvedRequests;
    let losingSlate;

    beforeEach(async () => {
      token = await utils.newToken({ initialTokens, from: creator });
      gatekeeper = await utils.newGatekeeper({ tokenAddress: token.address, from: creator });
      capacitor = await TokenCapacitor.new(gatekeeper.address, { from: creator });

      // Charge the capacitor
      await token.transfer(capacitor.address, capacitorSupply, { from: creator });

      // Allocate tokens
      const allocatedTokens = '1000';
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.transfer(carol, allocatedTokens, { from: creator });

      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // create simple ballot with just grants
      proposals1 = [
        { to: alice, tokens: '1000', metadataHash: utils.createMultihash('grant for Alice') },
        { to: alice, tokens: '1000', metadataHash: utils.createMultihash('another grant for Alice') },
      ];

      await grantSlateFromProposals({
        gatekeeper,
        proposals: proposals1,
        capacitor,
        recommender: recommender1,
        metadata: 'slate 1',
        batchNumber: ballotID,
      });

      proposals2 = [
        { to: recommender2, tokens: '100000', metadataHash: utils.createMultihash('All to me') },
      ];

      await grantSlateFromProposals({
        gatekeeper,
        proposals: proposals2,
        capacitor,
        recommender: recommender2,
        metadata: 'slate 2',
        batchNumber: ballotID,
      });


      // Commit ballots
      const aliceReveal = await voteSingle(gatekeeper, alice, GRANT, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GRANT, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GRANT, 1, 0, '1000', '9012');

      // Reveal all votes
      await revealVote(gatekeeper, aliceReveal);
      await revealVote(gatekeeper, bobReveal);
      await revealVote(gatekeeper, carolReveal);

      // count votes
      await gatekeeper.countVotes(ballotID, GRANT);
      winningSlate = await gatekeeper.getWinningSlate(ballotID, GRANT);
      approvedRequests = await gatekeeper.slateRequests(winningSlate);

      losingSlate = new BN('1');
      assert(losingSlate.toString() !== winningSlate.toString());
    });

    it('should send tokens to the appropriate address if the request has been approved', async () => {
      const proposalID = approvedRequests[0];

      const { to: beneficiary, tokens: amount } = await capacitor.proposals(proposalID);
      const initialBalance = await token.balanceOf(beneficiary);

      // Withdraw
      const receipt = await capacitor.withdrawTokens(proposalID, { from: beneficiary });

      // Check logs
      const {
        proposalID: emittedProposalID,
        to: emittedBeneficiary,
        numTokens: emittedTokens,
      } = receipt.logs[0].args;

      assert.strictEqual(
        emittedProposalID.toString(),
        proposalID.toString(),
        'Emitted wrong proposalID',
      );
      assert.strictEqual(emittedBeneficiary, beneficiary, 'Emitted wrong beneficiary');
      assert.strictEqual(
        emittedTokens.toString(),
        amount.toString(),
        'Emitted wrong number of tokens',
      );

      // beneficiary 1 should have increased balance
      const expectedBalance = initialBalance.add(new BN(amount));
      const finalBalance = await token.balanceOf(beneficiary);
      assert.strictEqual(
        finalBalance.toString(),
        expectedBalance.toString(),
        'Tokens were not transferred',
      );
    });

    it('should allow someone other than the grantee to send the tokens', async () => {
      const proposalID = approvedRequests[0];

      const { to: beneficiary, tokens: amount } = await capacitor.proposals(proposalID);
      const initialBalance = await token.balanceOf(beneficiary);

      // Someone else withdraws the tokens
      const caller = bob;
      assert(caller !== beneficiary, 'Caller was the beneficiary');
      await capacitor.withdrawTokens(proposalID, { from: caller });

      // Beneficiary should have gotten the tokens
      const expectedBalance = initialBalance.add(new BN(amount));
      const finalBalance = await token.balanceOf(beneficiary);
      assert.strictEqual(
        finalBalance.toString(),
        expectedBalance.toString(),
        'Tokens were not transferred',
      );
    });

    it('should not allow multiple withdrawals for the same proposal ID', async () => {
      const proposalID = approvedRequests[0];
      const { to: beneficiary } = await capacitor.proposals(proposalID);

      // Withdraw tokens
      await capacitor.withdrawTokens(proposalID, { from: beneficiary });

      // Try to withdraw again
      try {
        await capacitor.withdrawTokens(proposalID, { from: beneficiary });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'already been withdrawn');
        return;
      }
      assert.fail('Allowed multiple withdrawals for the same request ID');
    });

    it('should revert if the proposal has not been approved by the gatekeeper', async () => {
      const rejectedRequests = await gatekeeper.slateRequests(losingSlate);
      const proposalID = rejectedRequests[0];
      const { to: beneficiary } = await capacitor.proposals(proposalID);

      try {
        await capacitor.withdrawTokens(proposalID, { from: beneficiary });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Proposal has not been approved');
        return;
      }
      assert.fail('Allowed withdrawal for a rejected request');
    });

    it('should revert if the proposal ID is invalid', async () => {
      const proposalID = '5000';
      try {
        await capacitor.withdrawTokens(proposalID, { from: alice });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Invalid proposalID');
        return;
      }
      assert.fail('Allowed withdrawal for an invalid proposalID');
    });
  });
});
