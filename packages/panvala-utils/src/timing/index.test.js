const { utils } = require('ethers');
const { timing } = require('../..');
const { durations } = timing;

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
      expect(() => {
        timing.nextEpochStage(val);
      }).toThrow();
    }

    const invalidValues = [
      7,
      -1,
      '523414321',
      utils.bigNumberify(1234556234),
      utils.bigNumberify(-1),
      utils.bigNumberify('12345235'),
      'SlateSubmission',
      'Intermission',
      'CommitVoting',
      'RevealVoting',
    ];

    invalidValues.forEach(expectFailure);
  });
});

describe('getTimingsForEpoch', () => {
  test('should get the correct epoch timings using the durations constant', () => {
    const epochStart = 1549040400;
    const epochDates = timing.getTimingsForEpoch(epochStart);
    const expectedDates = {
      epochStart,
      slateSubmissionStart: epochStart + durations.ONE_WEEK,
      slateSubmissionDeadline: epochStart + durations.SLATE_SUBMISSION_DEADLINE,
      votingStart: epochStart + durations.VOTING_PERIOD_START,
      votingEnd: epochStart + durations.REVEAL_PERIOD_START,
      epochEnd: epochStart + durations.EPOCH_LENGTH - 1,
    };
    expect(epochDates).toEqual(expectedDates);
  });
});

describe('calculateEpochStage', () => {
  let epochStart, epochDates;

  beforeAll(() => {
    epochStart = 1549040400;
    epochDates = timing.getTimingsForEpoch(epochStart);
  });

  test('should get the correct epoch stage', () => {
    const stage0 = timing.calculateEpochStage(epochDates, epochStart + 1);
    expect(stage0).toBe(0);

    const stage1 = timing.calculateEpochStage(
      epochDates,
      epochStart + durations.SLATE_SUBMISSION_DEADLINE
    );
    expect(stage1).toBe(1);

    const stage2 = timing.calculateEpochStage(
      epochDates,
      epochStart + durations.VOTING_PERIOD_START
    );
    expect(stage2).toBe(2);

    const stage3 = timing.calculateEpochStage(
      epochDates,
      epochStart + durations.REVEAL_PERIOD_START
    );
    expect(stage3).toBe(3);
  });

  test('should throw if given an invalid timestamp', () => {
    expect(() => {
      timing.calculateEpochStage(epochDates, epochStart - 1);
    }).toThrow();

    expect(() => {
      timing.calculateEpochStage(epochDates, epochStart + durations.EPOCH_LENGTH);
    }).toThrow();
  });
});

const testEpochStart = 1572714000; // Nov 2 2018, 1pm EST
const testGatekeeper = {
  epochStart(epochNumber) {
    const diff = utils.bigNumberify(epochNumber).mul(durations.EPOCH_LENGTH);
    return utils.bigNumberify(testEpochStart).add(diff);
  },
  slateSubmissionDeadline(epochNumber, resource) {
    return testGatekeeper.epochStart(epochNumber).add(durations.SLATE_SUBMISSION_DEADLINE);
  },
};

describe('getEpochDetails', () => {
  test("nextEpochStart of an epoch should equal the subsequent epoch's epochStart", async () => {
    const epochDates0 = await timing.getEpochDetails(0, testGatekeeper, 'resource');
    const epochDates1 = await timing.getEpochDetails(1, testGatekeeper, 'resource');
    expect(epochDates1.epochStart).toBe(epochDates0.nextEpochStart);
  });
});
