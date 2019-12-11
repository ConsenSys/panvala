'use strict';

import { BigNumber, BigNumberish } from 'ethers/utils';
import { utils } from 'ethers';
import { IGatekeeper } from '../types';

const ONE_DAY: number = 86400;
const ONE_WEEK: number = ONE_DAY * 7;

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

export const durations = {
  ONE_DAY,
  ONE_WEEK,
  SLATE_SUBMISSION_DEADLINE: ONE_WEEK * 5.5,
  VOTING_PERIOD_START: ONE_WEEK * 11,
  REVEAL_PERIOD_START: ONE_WEEK * 12,
  EPOCH_LENGTH: ONE_WEEK * 13,
};

export enum EpochStageDates {
  SlateSubmission = 'slateSubmissionStart',
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

export function getTimingsForEpoch(epochStart: BigNumberish): EpochDates {
  epochStart = utils.bigNumberify(epochStart).toNumber();

  return {
    epochStart,
    slateSubmissionStart: epochStart + durations.ONE_WEEK,
    slateSubmissionDeadline: epochStart + durations.SLATE_SUBMISSION_DEADLINE,
    votingStart: epochStart + durations.VOTING_PERIOD_START,
    votingEnd: epochStart + durations.REVEAL_PERIOD_START,
    epochEnd: epochStart + durations.EPOCH_LENGTH - 1,
  };
}

export function calculateEpochStage(epochDates: EpochDates, timestamp: number): number {
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

export function nextEpochStage(currStage: number): number {
  currStage = utils.bigNumberify(currStage).toNumber();

  if (!EpochStages[currStage]) {
    throw new Error('Invalid stage number. try 0-3');
  }

  return currStage === EpochStages.SlateSubmission
    ? EpochStages.CommitVoting
    : currStage === EpochStages.RevealVoting
    ? EpochStages.SlateSubmission
    : currStage + 1;
}

export async function getEpochDetails(
  epochNumber: BigNumber,
  gatekeeper: IGatekeeper,
  resource: string
) {
  const epochStart: BigNumber = await gatekeeper.epochStart(epochNumber);
  const timings: any = getTimingsForEpoch(epochStart);
  // console.log('timings:', timings);

  // prettier-ignore
  const proposalSubmissionCloses = epochStart.add(durations.ONE_WEEK * 3).toNumber()
  const slateCreationCloses = await gatekeeper.slateSubmissionDeadline(epochNumber, resource);

  const epochDetails: EpochDetails = {
    epochNumber: utils.bigNumberify(epochNumber).toNumber(),
    epochStart: timings.epochStart,
    proposalSubmissionOpens: timings.slateSubmissionStart,
    proposalSubmissionCloses,
    slateCreationOpens: timings.slateSubmissionStart,
    slateCreationCloses: slateCreationCloses.toNumber(),
    votingOpens: timings.votingStart,
    votingCloses: timings.votingEnd,
    votingConcludes: timings.epochEnd,
    nextEpochStart: timings.epochEnd + 1,
  };

  return epochDetails;
}
