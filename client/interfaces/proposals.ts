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
  category: string;
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

export interface IParameterChangesObject {
  [key: string]: {
    oldValue: any;
    newValue: any;
    type: any;
    key: any;
  };
}

export interface IGovernanceProposalMetadata {
  id: number;
  firstName: string;
  lastName?: string;
  summary: string;
  organization?: string;
  parameterChanges: IParameterChangesObject;
}

export interface IGovernanceProposalInfo {
  metadatas: IGovernanceProposalMetadata[];
  multihashes: Buffer[];
}
