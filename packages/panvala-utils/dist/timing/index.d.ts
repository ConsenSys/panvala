import { BigNumberish } from 'ethers/utils';
export interface EpochDates {
  epochStart: number;
  slateSubmissionDeadline: number;
  votingStart: number;
  votingEnd: number;
  epochEnd: number;
}
export declare function getTimingsForEpoch(epochStart: BigNumberish): EpochDates;
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
export declare function calculateEpochStage(epochDates: EpochDates, timestamp: number): number;
export declare function nextEpochStage(currStage: number): number;
