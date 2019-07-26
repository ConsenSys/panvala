import { BigNumberish } from 'ethers/utils';
import { utils } from 'ethers';

// import * as moment from 'moment';
// import { Contract } from 'ethers';

const ONE_DAY = 86400;
const ONE_WEEK = ONE_DAY * 7;

const timings = {
  ONE_DAY,
  ONE_WEEK,
  SLATE_SUBMISSION_DEADLINE: ONE_WEEK * 5.5,
  VOTING_PERIOD_START: ONE_WEEK * 11,
  REVEAL_PERIOD_START: ONE_WEEK * 12,
  EPOCH_LENGTH: ONE_WEEK * 13,
};

/**
 *
 * @param {number} ts UNIX timestamp in seconds
 */
// function toDate(ts: number): moment.Moment {
//   return moment.unix(ts).utc();
// }

interface EpochDates {
  epochStart: number;
  slateSubmissionDeadline: number;
  votingStart: number;
  votingEnd: number;
  epochEnd: number;
}

function getTimingsForEpoch(epochStart: BigNumberish): EpochDates {
  epochStart = utils.bigNumberify(epochStart).toNumber();
  return {
    epochStart,
    slateSubmissionDeadline: epochStart + timings.SLATE_SUBMISSION_DEADLINE,
    votingStart: epochStart + timings.VOTING_PERIOD_START,
    votingEnd: epochStart + timings.REVEAL_PERIOD_START,
    epochEnd: epochStart + timings.EPOCH_LENGTH - 1,
  };
}

// function currentTime() {
//   return Math.floor(Date.now() / 1000);
// }

export enum EpochStageDates {
  SlateSubmission = 'epochStart',
  Intermission = 'slateSubmissionDeadline',
  CommitVoting = 'votingStart',
  RevealVoting = 'votingEnd',
}

export enum EpochStages {
  SlateSubmission,
  Intermission,
  CommitVoting,
  RevealVoting,
}

function calculateEpochStage(epochDates: EpochDates, timestamp: number): number {
  const { epochStart, slateSubmissionDeadline, votingStart, votingEnd, epochEnd } = epochDates;

  if (timestamp >= epochStart && timestamp < slateSubmissionDeadline) {
    return EpochStages.SlateSubmission;
  }
  if (timestamp >= slateSubmissionDeadline && timestamp < votingStart) {
    return EpochStages.Intermission;
  }
  if (timestamp >= votingStart && timestamp < votingEnd) {
    return EpochStages.CommitVoting;
  }
  if (timestamp >= votingEnd && timestamp <= epochEnd) {
    return EpochStages.RevealVoting;
  }

  throw new Error(`Timestamp ${timestamp} not in epoch range ${epochStart} - ${epochEnd}`);
}

function nextEpochStage(currStage: number) {
  if (!EpochStages[currStage]) {
    throw new Error('Invalid stage number. try 0-3');
  }
  return currStage === EpochStages.SlateSubmission
    ? EpochStages.CommitVoting
    : currStage === EpochStages.RevealVoting
    ? EpochStages.SlateSubmission
    : currStage + 1;
}

module.exports = {
  getTimingsForEpoch,
  calculateEpochStage,
  EpochStages,
  EpochStageDates,
  nextEpochStage,
};
