import { utils } from 'ethers';
import { BasicToken, Gatekeeper, TokenCapacitor, ParameterStore } from '../types';
import { IParameterChangesObject } from './components';

/**
 * Proposal fields that gets loaded/rendered in the frontend
 */
export interface IProposal {
  firstName: string;
  lastName: string;
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
export interface IGrantProposalMetadata {
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

export interface IGovernanceProposalMetadata {
  id: number;
  firstName: string;
  lastName?: string;
  title: string;
  summary: string;
  organization?: string;
  parameterChanges: IParameterChangesObject;
}

export interface IGovernanceProposalInfo {
  metadatas: IGovernanceProposalMetadata[];
  multihashes: Buffer[];
}

/**
 * Slate fields that gets loaded/rendered in the frontend
 */
export interface ISlate {
  id: number;
  category: string;
  status: number;
  deadline: number | false;
  title: string;
  owner: string;
  organization?: string;
  description: string;
  incumbent?: boolean;
  proposals: IProposal[];
  requiredStake: utils.BigNumberish;
  verifiedRecommender: boolean;
  recommender: string;
  staker?: string;
}

/**
 * Public slate metadata that gets saved to IPFS
 */
export interface ISlateMetadata {
  firstName: string;
  lastName?: string;
  organization?: string;
  title: string;
  description: string;
  proposalMultihashes: string[];
  proposals: IGrantProposalMetadata[] | IGovernanceProposalMetadata[];
}

/**
 * Slate data to be saved in the database
 */
export interface ISaveSlate {
  slateID: string;
  metadataHash: string;
  email?: string;
}

export interface IChoices {
  firstChoice: string;
  secondChoice: string;
}

export interface ISubmitBallot {
  choices: {
    [key: string]: {
      firstChoice: string;
      secondChoice: string;
    };
  };
  salt: string;
  voterAddress: string;
  epochNumber: string;
  delegate?: string;
}

export interface IBallotDates {
  startDate: number;
  votingOpenDate: number;
  votingCloseDate: number;
  finalityDate: number;
  initialSlateSubmissionDeadline: number;
  // category -> timestamp
  slateSubmissionDeadline: {
    [key: string]: number;
  };
  epochNumber: number;
}

export interface IContracts {
  tokenCapacitor: TokenCapacitor;
  gatekeeper: Gatekeeper;
  token: BasicToken;
  parameterStore: ParameterStore;
}

export interface INotification {
  action: string;
  text: string;
  href?: string;
  asPath?: string;
  id?: string;
}

export interface INotificationsContext {
  notifications: INotification[];
  onHandleGetUnreadNotifications(account: string, slatesByID: any, proposalsByID: any): void;
}
