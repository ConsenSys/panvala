import { BigNumber, BigNumberish } from 'ethers/utils';
import { IGatekeeper } from '../types';
export interface EpochDates {
    epochStart: number;
    slateSubmissionStart: number;
    slateSubmissionDeadline: number;
    votingStart: number;
    votingEnd: number;
    epochEnd: number;
}
export interface EpochDetails {
    epochNumber: number;
    epochStart: number;
    proposalSubmissionOpens: number;
    proposalSubmissionCloses: number;
    slateCreationOpens: number;
    slateCreationCloses: number;
    votingOpens: number;
    votingCloses: number;
    votingConcludes: number;
    nextEpochStart: number;
}
export declare const durations: {
    ONE_DAY: number;
    ONE_WEEK: number;
    SLATE_SUBMISSION_DEADLINE: number;
    VOTING_PERIOD_START: number;
    REVEAL_PERIOD_START: number;
    EPOCH_LENGTH: number;
};
export declare enum EpochStageDates {
    SlateSubmission = "slateSubmissionStart",
    Intermission = "slateSubmissionDeadline",
    CommitVoting = "votingStart",
    RevealVoting = "votingEnd"
}
export declare enum EpochStages {
    SlateSubmission = 0,
    Intermission = 1,
    CommitVoting = 2,
    RevealVoting = 3
}
export declare function getTimingsForEpoch(epochStart: BigNumberish): EpochDates;
export declare function calculateEpochStage(epochDates: EpochDates, timestamp: number): number;
export declare function nextEpochStage(currStage: number): number;
export declare function getEpochDetails(epochNumber: BigNumber, gatekeeper: IGatekeeper, resource: string): Promise<EpochDetails>;
