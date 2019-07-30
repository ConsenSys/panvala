import { BigNumberish } from 'ethers/utils';
export interface Durations {
  ONE_DAY: number;
  ONE_WEEK: number;
  SLATE_SUBMISSION_DEADLINE: number;
  VOTING_PERIOD_START: number;
  REVEAL_PERIOD_START: number;
  EPOCH_LENGTH: number;
}
export interface EpochDates {
  epochStart: number;
  slateSubmissionDeadline: number;
  votingStart: number;
  votingEnd: number;
  epochEnd: number;
}
export declare enum EpochStageDates {
  SlateSubmission = 'epochStart',
  Intermission = 'slateSubmissionDeadline',
  CommitVoting = 'votingStart',
  RevealVoting = 'votingEnd',
}
export declare enum EpochStages {
  SlateSubmission = 0,
  Intermission = 1,
  CommitVoting = 2,
  RevealVoting = 3,
}
export declare function getTimingsForEpoch(epochStart: BigNumberish): EpochDates;
export declare function calculateEpochStage(epochDates: EpochDates, timestamp: number): number;
export declare function nextEpochStage(currStage: number): number;
