export const statuses = {
  PENDING_TOKENS: 'PENDING TOKENS',
  PENDING_VOTE: 'PENDING VOTE',
  PROPOSAL_DEADLINE: 'PROPOSAL DEADLINE',
};

export function convertEVMStatus(status: number) {
  console.log('status:', status);
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

export function isProposalDeadline(status: string) {
  return status === statuses.PROPOSAL_DEADLINE;
}
