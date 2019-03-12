import { providers, Contract } from 'ethers';

/**
 * Proposal fields that gets loaded/rendered in the frontend
 */
export interface IProposal {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  summary: string;
  tokensRequested: string;
  github?: string;
  referral?: string;
  category?: string;
  createdAt?: any;
  id: number;
  website?: string;
  organization?: string;
  recommendation?: string;
  projectPlan?: string;
  projectTimeline?: string;
  teamBackgrounds?: string;
  totalBudget?: string;
  otherFunding?: string;
  awardAddress: string;
}

/**
 * Public proposal metadata that gets saved to IPFS
 */
export interface IProposalMetadata {
  firstName: string;
  lastName: string;
  title: string;
  summary: string;
  tokensRequested: string;
  github?: string;
  id: number;
  website?: string;
  organization?: string;
  recommendation?: string;
  projectPlan?: string;
  projectTimeline?: string;
  teamBackgrounds?: string;
  otherFunding?: string;
  awardAddress: string;
}

/**
 * Slate fields that gets loaded/rendered in the frontend
 */
export interface ISlate {
  id: string;
  category: string;
  status: string;
  deadline: number | false;
  title: string;
  owner: string;
  ownerAddress: string;
  organization?: string;
  description: string;
  incumbent?: boolean;
  proposals: IProposal[];
  requiredStake: string;
}

/**
 * Public slate metadata that gets saved to IPFS
 */
export interface ISlateMetadata {
  firstName: string;
  lastName?: string;
  organization?: string;
  // do not include email
  title: string;
  description: string;
  proposalMultihashes: string[];
  proposals: IProposalMetadata[];
}

export interface IContracts {
  tokenCapacitor: Contract;
  gateKeeper: Contract;
}

export interface IAppContext {
  slates?: ISlate[];
  proposals?: IProposal[];
  slateStakingDeadline?: number;
  proposalDeadline?: number;
  onNotify?: any;
  onRefreshProposals?: any;
}

export interface IEthereumContext {
  account: string;
  ethProvider?: providers.Web3Provider;
  contracts?: IContracts;
}
