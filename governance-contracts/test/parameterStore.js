/* eslint-env mocha */
/* global assert artifacts contract */
const utils = require('./utils');

const {
  abiCoder, abiEncode, expectErrorLike, expectRevert, governanceSlateFromProposals,
  voteSingle, timing, revealVote, BN, getResource,
} = utils;

const { increaseTime } = utils.evm;

const ParameterStore = artifacts.require('ParameterStore');


contract('ParameterStore', (accounts) => {
  describe('constructor', () => {
    const [creator] = accounts;
    const data = {
      apples: abiEncode('uint256', 2),
      bananas: abiEncode('uint256', 3),
    };
    let names;
    let values;

    beforeEach(() => {
      names = Object.keys(data);
      values = Object.values(data);
    });

    it('should correctly initialize the parameter store', async () => {
      const parameters = await ParameterStore.new(
        names, values,
        { from: creator },
      );

      // get values
      const apples = await parameters.get('apples');
      assert.strictEqual(apples.toString(), data.apples);

      const bananas = await parameters.get('bananas');
      assert.strictEqual(bananas.toString(), data.bananas);
    });

    it('should be okay with no initial values', async () => {
      await ParameterStore.new([], []);
    });
  });

  describe('init', () => {
    const [creator, user] = accounts;
    let parameters;

    beforeEach(async () => {
      // deploy
      parameters = await ParameterStore.new([], [], { from: creator });
    });

    it('should allow the creator to initialize', async () => {
      await parameters.init({ from: creator });
    });

    it('should not allow multiple initializations', async () => {
      await parameters.init({ from: creator });

      try {
        await parameters.init({ from: creator });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed multiple initializations');
    });

    it('should not allow anyone other than the creator to initialize', async () => {
      try {
        await parameters.init({ from: user });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed someone other than the creator to initialize');
    });
  });

  describe('setInitialValue', () => {
    const [creator, user] = accounts;
    let parameters;

    beforeEach(async () => {
      // deploy
      parameters = await ParameterStore.new([], [], { from: creator });
    });

    it('should allow the creator to set initial values', async () => {
      const value = abiEncode('uint256', 5);
      await parameters.setInitialValue('test', value, { from: creator });

      const test = await parameters.get('test');
      assert.strictEqual(test.toString(), value);
    });

    it('should not allow someone other than the creator to set initial values', async () => {
      const value = abiEncode('uint256', 5);

      try {
        await parameters.setInitialValue('test', value, { from: user });
      } catch (error) {
        expectRevert(error);
        return;
      }

      assert.fail('Allowed someone other than the creator to set initial values');
    });

    it('should not allow the creator to set values after initialization', async () => {
      const value = abiEncode('uint256', 5);
      await parameters.init({ from: creator });

      try {
        await parameters.setInitialValue('test', value, { from: creator });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Cannot set values after initialization');
        return;
      }

      assert.fail('Allowed the creator to set initial values after initialization');
    });
  });

  // get - what about non-existent values
  describe('get', () => {
    const [creator] = accounts;

    describe('asAddress', () => {
      it('should retrieve an address value', async () => {
        const key = 'someAddress';
        const value = abiCoder.encode(['address'], [creator]);
        const parameters = await ParameterStore.new([key], [value]);

        const retrievedValue = await parameters.getAsAddress(key);
        assert.strictEqual(retrievedValue, creator);
      });
    });
  });

  describe('createProposal', () => {
    const [creator, proposer] = accounts;
    let gatekeeper;
    let parameters;

    beforeEach(async () => {
      // deploy
      ({ parameters, gatekeeper } = await utils.newPanvala({ from: creator }));
    });

    it('it should create a proposal to change a parameter', async () => {
      const key = 'someKey';
      const value = 5;
      const encodedValue = abiEncode('uint256', value);
      const metadataHash = utils.createMultihash('my request data');

      const receipt = await parameters.createProposal(
        key,
        encodedValue,
        utils.asBytes(metadataHash),
        { from: proposer },
      );

      // Should emit event with requestID and other data
      assert.strictEqual(receipt.logs[0].event, 'ProposalCreated');
      const {
        proposalID,
        proposer: emittedProposer,
        requestID,
        key: emittedKey,
        value: emittedValue,
        metadataHash: emittedHash,
      } = receipt.logs[0].args;

      assert.strictEqual(requestID.toString(), '0', 'Emitted wrong requestID');
      assert.strictEqual(proposalID.toString(), '0', 'Emitted wrong proposalID');
      assert.strictEqual(emittedProposer, proposer, 'Emitted wrong proposer');
      assert.strictEqual(emittedKey, key, 'Emitted wrong key');
      assert.strictEqual(emittedValue.toString(), encodedValue, 'Emitted wrong value');
      assert.strictEqual(
        utils.bytesAsString(emittedHash),
        metadataHash,
        'Emitted wrong metadataHash',
      );

      // should increment proposal count
      const proposalCount = await parameters.proposalCount();
      assert.strictEqual(proposalCount.toString(), '1', 'Should have incremented proposalCount');

      // should save proposal with values
      const proposal = await parameters.proposals(requestID);
      assert.strictEqual(proposal.gatekeeper, gatekeeper.address, 'Proposal has wrong gatekeeper');
      assert.strictEqual(proposal.requestID.toString(), '0', 'Proposal has wrong requestID');
      assert.strictEqual(proposal.key, key, 'Proposal has wrong key');
      assert.strictEqual(proposal.value, encodedValue, 'Proposal has wrong value');
      assert.strictEqual(
        utils.bytesAsString(proposal.metadataHash),
        metadataHash,
        'Proposal has wrong metadataHash',
      );

      // proposal should not be marked as executed
      assert.strictEqual(proposal.executed, false, 'Proposal should not be executed');
    });

    // rejection criteria
    it('should not allow creation of a proposal with an empty metadataHash', async () => {
      const key = 'someKey';
      const value = 5;
      const encodedValue = abiEncode('uint256', value);
      const emptyHash = '';

      try {
        await parameters.createProposal(
          key,
          encodedValue,
          utils.asBytes(emptyHash),
          { from: creator },
        );
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'empty');
        return;
      }
      assert.fail('allowed creation of a proposal with an empty metadataHash');
    });

    describe('createManyProposals', () => {
      it('should create proposals and emit an event for each', async () => {
        const keys = ['number1', 'number2', 'address'];
        const values = [
          abiEncode('uint256', 5),
          abiEncode('uint256', 10),
          abiEncode('address', utils.zeroAddress()),
        ];
        const metadataHashes = ['request1', 'request2', 'request3'].map(utils.createMultihash);

        const receipt = await parameters.createManyProposals(
          keys,
          values,
          metadataHashes.map(utils.asBytes),
          { from: proposer },
        );

        assert.strictEqual(receipt.logs.length, keys.length, 'Wrong number of events');

        // eslint-disable-next-line
        for (let i = 0; i < keys.length; i++) {
          const log = receipt.logs[i];
          const key = keys[i];
          const value = values[i];
          const metadataHash = metadataHashes[i];

          const {
            proposalID,
            proposer: emittedProposer,
            requestID,
            key: emittedKey,
            value: emittedValue,
            metadataHash: emittedHash,
          } = log.args;

          // should emit event with requestID and other data
          const index = i.toString();
          assert.strictEqual(requestID.toString(), index, 'Emitted wrong requestID');
          assert.strictEqual(proposalID.toString(), index, 'Emitted wrong proposalID');
          assert.strictEqual(emittedProposer, proposer, 'Emitted wrong proposer');
          assert.strictEqual(emittedKey, key, 'Emitted wrong key');
          assert.strictEqual(emittedValue.toString(), value, 'Emitted wrong value');
          assert.strictEqual(
            utils.bytesAsString(emittedHash),
            metadataHash,
            'Emitted wrong metadataHash',
          );
        }
      });
    });
  });

  describe('setValue', () => {
    const [creator, recommender1, recommender2, alice, bob, carol] = accounts;

    let snapshotID;
    let gatekeeper;
    let parameters;
    let token;
    const initialTokens = '100000000';

    let ballotID;

    let proposals1;
    let proposals2;
    let winningSlate;
    let approvedRequests;
    let losingSlate;

    beforeEach(async () => {
      snapshotID = await utils.evm.snapshot();

      ({ gatekeeper, token, parameters } = await utils.newPanvala({
        initialTokens,
        from: creator,
      }));

      ballotID = await gatekeeper.currentEpochNumber();
      const GOVERNANCE = await getResource(gatekeeper, 'GOVERNANCE');

      // Allocate tokens
      const allocatedTokens = '10000';
      await token.transfer(alice, allocatedTokens, { from: creator });
      await token.transfer(bob, allocatedTokens, { from: creator });
      await token.transfer(carol, allocatedTokens, { from: creator });

      await token.approve(gatekeeper.address, allocatedTokens, { from: alice });
      await token.approve(gatekeeper.address, allocatedTokens, { from: bob });
      await token.approve(gatekeeper.address, allocatedTokens, { from: carol });

      // create simple ballot with just governance proposals
      proposals1 = [
        {
          key: 'param',
          value: abiEncode('uint256', '1000'),
          metadataHash: utils.createMultihash('important parameter'),
        },
        {
          key: 'param2',
          value: abiEncode('uint256', '1000'),
          metadataHash: utils.createMultihash('another important parameter'),
        },
      ];

      await governanceSlateFromProposals({
        gatekeeper,
        proposals: proposals1,
        parameterStore: parameters,
        recommender: recommender1,
        metadata: 'slate 1',
      });

      proposals2 = [
        {
          key: 'param',
          value: abiEncode('uint256', '0'),
          metadataHash: utils.createMultihash('this is totally safe'),
        },
      ];

      await governanceSlateFromProposals({
        gatekeeper,
        proposals: proposals2,
        parameterStore: parameters,
        recommender: recommender2,
        metadata: 'slate 2',
      });

      await token.transfer(recommender1, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: recommender1 });
      await token.transfer(recommender2, allocatedTokens, { from: creator });
      await token.approve(gatekeeper.address, allocatedTokens, { from: recommender2 });

      await gatekeeper.stakeTokens(0, { from: recommender1 });
      await gatekeeper.stakeTokens(1, { from: recommender2 });

      // Commit ballots
      await increaseTime(timing.VOTING_PERIOD_START);
      const aliceReveal = await voteSingle(gatekeeper, alice, GOVERNANCE, 0, 1, '1000', '1234');
      const bobReveal = await voteSingle(gatekeeper, bob, GOVERNANCE, 0, 1, '1000', '5678');
      const carolReveal = await voteSingle(gatekeeper, carol, GOVERNANCE, 1, 0, '1000', '9012');

      // Reveal all votes
      await increaseTime(timing.COMMIT_PERIOD_LENGTH);
      await revealVote(ballotID, gatekeeper, aliceReveal);
      await revealVote(ballotID, gatekeeper, bobReveal);
      await revealVote(ballotID, gatekeeper, carolReveal);

      // count votes
      await increaseTime(timing.REVEAL_PERIOD_LENGTH);
      await gatekeeper.countVotes(ballotID, GOVERNANCE);
      winningSlate = await gatekeeper.getWinningSlate(ballotID, GOVERNANCE);
      approvedRequests = await gatekeeper.slateRequests(winningSlate);

      losingSlate = new BN('1');
      assert(losingSlate.toString() !== winningSlate.toString());
    });

    it('should set the value if the request has been approved', async () => {
      const proposalID = approvedRequests[0];
      const { key, value } = await parameters.proposals(proposalID);

      // const initialValue = await parameters.get(key);
      // console.log(key, initialValue, '->', value);

      // Set the value
      const receipt = await parameters.setValue(proposalID, { from: alice });

      // Check logs
      utils.expectEvents(receipt, ['ParameterInitialized', 'ParameterSet']);

      const {
        proposalID: emittedProposalID,
        key: emittedKey,
        value: emittedValue,
      } = receipt.logs[1].args;

      assert.strictEqual(
        emittedProposalID.toString(),
        proposalID.toString(),
        'Emitted wrong proposalID',
      );
      assert.strictEqual(emittedKey, key, 'Emitted wrong key');
      assert.strictEqual(emittedValue.toString(), value.toString(), 'Emitted wrong key');

      // Value should have been set
      const newValue = await parameters.get(key);
      assert.strictEqual(
        newValue.toString(),
        value.toString(),
        'Value was not set',
      );
    });

    it('should not allow multiple executions for the same proposal ID', async () => {
      const proposalID = approvedRequests[0];
      // const { key } = await capacitor.proposals(proposalID);

      // Execute proposal
      await parameters.setValue(proposalID, { from: alice });

      // Try to execute again
      try {
        await parameters.setValue(proposalID, { from: alice });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'already executed');
        return;
      }
      assert.fail('Allowed multiple executions for the same request ID');
    });

    it('should revert if the proposal has not been approved by the gatekeeper', async () => {
      const rejectedRequests = await gatekeeper.slateRequests(losingSlate);
      const proposalID = rejectedRequests[0];
      // const { to: beneficiary } = await capacitor.proposals(proposalID);

      try {
        await parameters.setValue(proposalID, { from: alice });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Proposal has not been approved');
        return;
      }
      assert.fail('Allowed execution for a rejected request');
    });

    it('should revert if the proposal ID is invalid', async () => {
      const proposalID = '9999';
      try {
        await parameters.setValue(proposalID, { from: alice });
      } catch (error) {
        expectRevert(error);
        expectErrorLike(error, 'Invalid proposalID');
        return;
      }
      assert.fail('Allowed execution for an invalid proposalID');
    });

    afterEach(async () => utils.evm.revert(snapshotID));
  });
});
