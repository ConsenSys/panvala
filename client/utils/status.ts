import { IBallotDates } from '../interfaces';
import { dateHasPassed } from './datetime';

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

export const SlateStatus = {
  Unstaked: '0',
  Staked: '1',
  Rejected: '2',
  Accepted: '3',
};

export function convertEVMSlateStatus(status: number) {
  // TODO: caller should handle this
  if (typeof status === 'undefined') {
    return statuses.PENDING_TOKENS;
  }

  const s = status.toString();
  if (s === SlateStatus.Unstaked) {
    return statuses.PENDING_TOKENS;
  } else if (s === SlateStatus.Staked) {
    return statuses.PENDING_VOTE;
  } else if (s === SlateStatus.Rejected) {
    return statuses.SLATE_REJECTED;
  }

  return statuses.SLATE_ACCEPTED;
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
  } else if (isBallotFinalized(ballot)) {
    prefix = 'BALLOT FINALIZED';
    deadline = ballot.finalityDate + 1;
  }

  return { deadline, prefix };
}

export function ballotDates(startDate: number): IBallotDates {
  const oneWeekSeconds = 604800;
  const epochStartDate = startDate;
  const week11EndDate = epochStartDate + oneWeekSeconds * 11;
  const week12EndDate = week11EndDate + oneWeekSeconds;
  const week13EndDate = week12EndDate + oneWeekSeconds;

  return {
    startDate,
    votingOpenDate: week11EndDate,
    votingCloseDate: week12EndDate,
    finalityDate: week13EndDate,
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
