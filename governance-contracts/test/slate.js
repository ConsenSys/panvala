/* eslint-env mocha */
/* global assert artifacts contract */
const utils = require('./utils');

const Slate = artifacts.require('Slate');

const { bytesAsString, expectRevert, SlateStatus } = utils;


contract('Slate', (accounts) => {
  describe('constructor', () => {
    const [owner, recommender] = accounts;
    let requestIDs;

    beforeEach(async () => {
      // Set up requests for slate
      requestIDs = [0, 1, 2, 3];
    });

    it('should correctly initialize a slate', async () => {
      const metadataHash = utils.createMultihash('my slate');

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      // recommender
      const actualRecommender = await slate.recommender();
      assert.strictEqual(actualRecommender, recommender, 'Recommender was not properly set');

      // metadataHash
      const actualMetadata = await slate.metadataHash();
      assert.strictEqual(bytesAsString(actualMetadata), metadataHash.toString(), 'Metadata hash is incorrect');

      // requests
      const requestsExistence = await Promise.all(requestIDs.map(id => slate.requestIncluded(id)));
      requestsExistence.forEach((exists) => {
        assert(exists, 'Request should exist');
      });

      const storedRequests = await slate.getRequests.call();
      assert.deepStrictEqual(
        storedRequests.map(r => r.toString()),
        requestIDs.map(r => r.toString()),
        'Requests were not properly stored',
      );

      // status
      const actualStatus = await slate.status.call();
      assert.strictEqual(actualStatus.toString(), SlateStatus.Unstaked, 'Status should have been `Unstaked`');
    });

    it('should allow creation of an empty slate', async () => {
      const metadataHash = utils.createMultihash('my slate');
      requestIDs = [];

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      // status
      const actualStatus = await slate.status.call();
      assert.strictEqual(actualStatus.toString(), SlateStatus.Unstaked, 'Status should have been `Unstaked`');
    });

    // rejection criteria
    it('should not allow creation of a slate if the recommender is the zero address', async () => {
      const metadataHash = utils.createMultihash('my slate');
      const invalidRecommender = utils.zeroAddress();

      try {
        await Slate.new(
          invalidRecommender,
          utils.asBytes(metadataHash),
          requestIDs,
          { from: owner },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed creation of a request with an empty metadataHash');
    });

    it('should not allow creation of a slate with an empty metadataHash', async () => {
      const emptyHash = '';

      try {
        await Slate.new(
          recommender,
          utils.asBytes(emptyHash),
          requestIDs,
          { from: recommender },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed creation of a slate with an empty metadataHash');
    });

    it('should not allow creation of a slate with duplicate request IDs', async () => {
      const metadataHash = utils.createMultihash('my slate');
      requestIDs = [0, 1, 0, 2];

      try {
        await Slate.new(
          recommender,
          utils.asBytes(metadataHash),
          requestIDs,
          { from: owner },
        );
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('allowed creation of a request with duplicate requestIDs');
    });
  });

  describe('markAccepted', () => {
    const [owner, recommender] = accounts;
    let requestIDs;

    beforeEach(async () => {
      // Set up requests for slate
      requestIDs = [0, 1, 2, 3];
    });

    it('should allow the owner to mark a slate as accepted', async () => {
      const metadataHash = utils.createMultihash('my slate');

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      const receipt = await slate.markAccepted({ from: owner });
      const { event } = receipt.logs[0];
      assert.strictEqual(event, 'Accepted');
    });

    it('should not allow an account other than the owner to mark a slate as accepted', async () => {
      const metadataHash = utils.createMultihash('my slate');

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      try {
        await slate.markAccepted({ from: recommender });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed an account other than the owner to mark a slate as accepted');
    });
  });

  describe('markRejected', () => {
    const [owner, recommender] = accounts;
    let requestIDs;

    beforeEach(async () => {
      // Set up requests for slate
      requestIDs = [0, 1, 2, 3];
    });

    it('should allow the owner to mark a slate as rejected', async () => {
      const metadataHash = utils.createMultihash('my slate');

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      const receipt = await slate.markRejected({ from: owner });
      const { event } = receipt.logs[0];
      assert.strictEqual(event, 'Rejected');
    });

    it('should not allow an account other than the owner to mark a slate as rejected', async () => {
      const metadataHash = utils.createMultihash('my slate');

      const slate = await Slate.new(
        recommender,
        utils.asBytes(metadataHash),
        requestIDs,
        { from: owner },
      );

      try {
        await slate.markRejected({ from: recommender });
      } catch (error) {
        expectRevert(error);
        return;
      }
      assert.fail('Allowed an account other than the owner to mark a slate as rejected');
    });
  });
});
