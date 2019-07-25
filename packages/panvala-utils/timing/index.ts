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

function epochDatesByEpochStart(epochStart: BigNumberish): EpochDates {
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

function epochStageByTime(epochDates: EpochDates, time: number): number {
  const { epochStart, slateSubmissionDeadline, votingStart, votingEnd, epochEnd } = epochDates;

  if (time >= epochStart && time < slateSubmissionDeadline) {
    return EpochStages.SlateSubmission;
  }
  if (time >= slateSubmissionDeadline && time < votingStart) {
    return EpochStages.Intermission;
  }
  if (time >= votingStart && time < votingEnd) {
    return EpochStages.CommitVoting;
  }
  if (time >= votingEnd && time <= epochEnd) {
    return EpochStages.RevealVoting;
  }

  throw new Error(`Time ${time} not in epoch range ${epochStart} - ${epochEnd}`);
}

function getNextStage(currStage: number) {
  return currStage === EpochStages.SlateSubmission
    ? EpochStages.CommitVoting
    : currStage === EpochStages.RevealVoting
    ? EpochStages.SlateSubmission
    : currStage + 1;
}

module.exports = {
  epochDatesByEpochStart,
  epochStageByTime,
  EpochStages,
  EpochStageDates,
  getNextStage,
};
