import { BigNumberish } from 'ethers/utils';
import {
  IProposal,
  IGrantProposalMetadata,
  IGovernanceProposalMetadata,
  IParameterChangesObject,
} from './proposals';

/**
 * Slate fields that gets loaded/rendered in the frontend
 */
export interface ISlate {
  id: number;
  category: string;
  status: number;
  owner: string;
  organization: string;
  description: string;
  incumbent: boolean;
  proposals: IProposal[];
  requiredStake: BigNumberish;
  verifiedRecommender: boolean;
  recommender: string;
  staker: string;
  epochNumber: number;
}

export interface IGovernanceSlateFormValues {
  email: string;
  title: string;
  firstName: string;
  lastName?: string;
  organization?: string;
  summary: string;
  recommendation: string;
  parameters: IParameterChangesObject;
  stake: string;
}

/**
 * Public slate metadata that gets saved to IPFS
 */
export interface ISlateMetadata {
  firstName: string;
  lastName?: string;
  organization?: string;
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
