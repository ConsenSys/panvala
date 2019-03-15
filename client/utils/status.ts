import { IBallotDates } from '../interfaces';
import { dateHasPassed } from './datetime';

export const statuses = {
  PENDING_TOKENS: 'PENDING TOKENS',
  PENDING_VOTE: 'PENDING VOTE',
  PROPOSAL_DEADLINE: 'PROPOSAL DEADLINE',
  BALLOT_OPEN: 'BALLOT OPEN',
  BALLOT_CLOSED: 'BALLOT CLOSED',
  PRE_VOTING: 'PRE VOTING',
};

export function convertEVMSlateStatus(status: number) {
  if (status === 0) {
    return statuses.PENDING_TOKENS;
  }

  return statuses.PENDING_VOTE;
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
    deadline = ballot.finalityDate;
  } else if (isBallotFinalized(ballot)) {
    prefix = 'BALLOT FINALIZED';
    deadline = ballot.finalityDate + 1;
  }

  return { deadline, prefix };
}
