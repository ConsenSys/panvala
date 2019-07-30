import { utils } from 'ethers';
export interface IChoices {
    [resource: string]: {
        firstChoice: string;
        secondChoice: string;
    };
}
export declare enum ContestStatus {
    Empty = "0",
    NoContest = "1",
    Active = "2",
    RunoffPending = "3",
    Finalized = "4"
}
/**
 * generateCommitHash
 *
 * Concatenate each (resource, firstChoice, secondChoice), followed
 * by the salt, each element as a full 32-byte word. Hash the result.
 *
 * keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {IChoices} votes { resource: { firstChoice, secondChoice }}
 * @param {ethers.BN} salt Random 256-bit number
 */
export declare function generateCommitHash(votes: IChoices, salt: utils.BigNumber): string;
/**
 * Calculate a random number w/ 32 bytes of entropy
 */
export declare function randomSalt(): utils.BigNumber;
/**
 * generateCommitMessage
 *
 * @param {string} commitHash keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {IChoices} ballotChoices { resource: { firstChoice, secondChoice } }
 * @param {string} salt Random 256-bit number
 */
export declare function generateCommitMessage(commitHash: string, ballotChoices: IChoices, salt: string): string;
/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 */
export declare function encodeBallot(resources: string[], firstChoices: string[], secondChoices: string[]): string;
/**
 * Calculate the next slate submission deadline as halfway between now and the start of the
 * commit period.
 */
export declare function slateSubmissionDeadline(votingOpenDate: number, lastStaked: number): number;
export interface IBallotDates {
    startDate: number;
    votingOpenDate: number;
    votingCloseDate: number;
    finalityDate: number;
    initialSlateSubmissionDeadline: number;
    slateSubmissionDeadline: {
        [key: string]: number;
    };
    epochNumber: number;
}
export declare function ballotDates(startDate?: number): IBallotDates;
