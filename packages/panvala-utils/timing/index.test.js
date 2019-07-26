const { utils } = require('ethers');
const { timing } = require('../index.js');

describe('nextEpochStage', () => {
  test('should get the correct (next) epoch stage', () => {
    function expectSuccess(val, expected) {
      const stage = timing.nextEpochStage(val);
      expect(stage).toBe(expected);
    }
    expectSuccess(0, 2);
    expectSuccess(1, 2);
    expectSuccess(2, 3);
    expectSuccess(3, 0);
  });

  test('should throw if given an invalid value', () => {
    function expectFailure(val) {
      try {
        timing.nextEpochStage(val);
      } catch (error) {
        expect(error.message).toBe('Invalid stage number. try 0-3');
      }
    }

    const invalidValues = [
      7,
      -1,
      '523414321',
      utils.bigNumberify(1),
      utils.bigNumberify(1234556234),
      utils.bigNumberify(-1),
      utils.bigNumberify('1'),
      utils.bigNumberify('12345235'),
      'SlateSubmission',
      'Intermission',
      'CommitVoting',
      'RevealVoting',
    ];

    invalidValues.forEach(expectFailure);
  });
});

describe('calculateEpochStage', () => {
  test.skip('should get the correct epoch stage', () => {
    // timing.calculateEpochStage();
  });
});
