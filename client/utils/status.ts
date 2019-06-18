import { IBallotDates } from '../interfaces';
import { dateHasPassed } from './datetime';
import { utils } from 'ethers';
import { BN } from './format';

export const statuses = {
  PENDING_TOKENS: 'PENDING TOKENS',
  PENDING_VOTE: 'PENDING VOTE',
  PROPOSAL_DEADLINE: 'PROPOSAL DEADLINE',
  BALLOT_OPEN: 'BALLOT OPEN',
  BALLOT_CLOSED: 'BALLOT CLOSED',
  PRE_VOTING: 'PRE VOTING',
  SLATE_ACCEPTED: 'ACCEPTED',
  SLATE_REJECTED: 'REJECTED',
};

export enum SlateStatus {
  Unstaked = 0,
  Staked = 1,
  Rejected = 2,
  Accepted = 3,
}

export function convertEVMSlateStatus(status: number): string | undefined {
  switch (status) {
    case SlateStatus.Unstaked:
      return statuses.PENDING_TOKENS;
    case SlateStatus.Staked:
      return statuses.PENDING_VOTE;
    case SlateStatus.Rejected:
      return statuses.SLATE_REJECTED;
    case SlateStatus.Accepted:
      return statuses.SLATE_ACCEPTED;
  }

  return undefined;
}

export function isPendingTokens(status: string) {
  return status === statuses.PENDING_TOKENS;
}
export function isPendingVote(status: string) {
  return status === statuses.PENDING_VOTE;
}
export function isCurrentBallot(ballot: IBallotDates) {
  return dateHasPassed(ballot.startDate) && !dateHasPassed(ballot.finalityDate);
}
// weeks 1 - 11
export function isPreVoting(ballot: IBallotDates) {
  return dateHasPassed(ballot.startDate) && !dateHasPassed(ballot.votingOpenDate);
}
// week 12
export function isBallotOpen(ballot: IBallotDates) {
  return !dateHasPassed(ballot.votingCloseDate) && dateHasPassed(ballot.votingOpenDate);
}
// week 13
export function isBallotClosed(ballot: IBallotDates) {
  return dateHasPassed(ballot.votingCloseDate) && !dateHasPassed(ballot.finalityDate);
}
// week 14
export function isBallotFinalized(ballot: IBallotDates) {
  return dateHasPassed(ballot.finalityDate);
}

export function getPrefixAndDeadline(
  ballot: IBallotDates,
  route: string
): { deadline: number; prefix: string } {
  let deadline = 0,
    prefix = '';

  if (isPreVoting(ballot)) {
    deadline = ballot.votingOpenDate;
    if (route.includes('slates')) {
      // TODO: use resource (address)
      deadline = ballot.slateSubmissionDeadline.GRANT;
      prefix = 'SLATE STAKING DEADLINE';
    } else if (route.includes('proposals')) {
      prefix = 'PROPOSAL DEADLINE';
    } else if (route.includes('ballots')) {
      prefix = 'BALLOT OPENS';
    }
  } else if (isBallotOpen(ballot)) {
    prefix = 'VOTE UNTIL';
    deadline = ballot.votingCloseDate;
  } else if (isBallotClosed(ballot)) {
    prefix = 'VOTING CLOSED';
    deadline = ballot.votingCloseDate;
  } else if (ballot.votingOpenDate === 0) {
    prefix = 'LOADING...';
    deadline = 0;
  } else if (isBallotFinalized(ballot)) {
    prefix = 'BALLOT FINALIZED';
    deadline = ballot.finalityDate;
  }

  return { deadline, prefix };
}

/**
 * Calculate the next slate submission deadline as halfway between now and the start of the
 * commit period.
 */
export function slateSubmissionDeadline(votingOpenDate: number, lastStaked: number) {
  // prettier-ignore
  const extraTime = BN(votingOpenDate).sub(BN(lastStaked)).div('2');
  return BN(lastStaked)
    .add(extraTime)
    .toNumber();
}

export function ballotDates(startDate: number = 1549040400): IBallotDates {
  const oneWeekSeconds = 604800;
  const epochStartDate = utils.bigNumberify(startDate).toNumber();
  const week11EndDate: number = epochStartDate + oneWeekSeconds * 11; // 1555689600
  const week12EndDate: number = week11EndDate + oneWeekSeconds;
  const week13EndDate: number = week12EndDate + oneWeekSeconds;
  const initialSlateSubmissionDeadline = slateSubmissionDeadline(week11EndDate, startDate);

  return {
    startDate: epochStartDate,
    votingOpenDate: week11EndDate,
    votingCloseDate: week12EndDate,
    finalityDate: week13EndDate,
    initialSlateSubmissionDeadline,
    // TODO: use the resource (addresses) instead of GRANT/GOVERNANCE
    slateSubmissionDeadline: {
      GRANT: 0,
      GOVERNANCE: 0,
    },
  };
}

const statusStrings = {
  '0': 'Unstaked',
  '1': 'Staked',
  '2': 'Rejected',
  '3': 'Accepted',
};

export function slateStatusString(status: string): string {
  return (statusStrings as any)[status];
}
