import { providers, Contract, utils } from 'ethers';

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
  recommenderAddress: string;
  staker?: string;
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
      firstChoice: utils.BigNumber;
      secondChoice: utils.BigNumber;
    };
  };
  salt: string;
  voterAddress: string;
}

export interface IBallotDates {
  startDate: number;
  votingOpenDate: number;
  votingCloseDate: number;
  finalityDate: number;
}

export interface IContracts {
  tokenCapacitor: Contract;
  gatekeeper: Contract;
  token: Contract;
  parameterStore: Contract;
}

export interface IMainContext {
  slates?: ISlate[];
  proposals?: IProposal[];
  proposalsByID?: any;
  slatesByID?: any;
  currentBallot?: IBallotDates;
  onRefreshProposals?(): any;
  onRefreshSlates?(): any;
}
export interface IEthereumContext {
  account?: string;
  ethProvider?: providers.Web3Provider | {};
  contracts?: IContracts | {};
  panBalance: utils.BigNumber;
  gkAllowance: utils.BigNumber;
  tcAllowance: utils.BigNumber;
  votingRights: utils.BigNumber;
  slateStakeAmount: utils.BigNumberish;
  onRefreshBalances(): any;
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
  onHandleGetUnreadNotifications?(account: string): void;
}
