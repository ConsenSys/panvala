# Types

## Proposals

```ts
// add to ipfs
interface IGrantProposalMetadata {
  firstName: string;
  lastName?: string;
  organization?: string;
  title: string;
  summary: string;
  tokensRequested: string;
  awardAddress: string;

  github?: string;
  website?: string;
  projectPlan?: string;
  projectTimeline?: string;
  teamBackgrounds?: string;
  totalBudget?: string;
  otherFunding?: string;
}
// add to ipfs
interface IGovernanceProposalMetadata {
  oldValue: any;
  newValue: any;
  type: any;
  key: any;
}

// user input
interface IGrantProposalForm extends IGrantProposalMetadata {
  email: string;
}

// post to api & save to db
interface IGrantProposalRow extends IGrantProposalForm {
  ipAddress: string;
}

// part of state
interface GrantProposalType {
  kind: 'grant';
  firstName: string;
  lastName?: string;
  organization?: string;
  title: string;
  summary: string;
  tokensRequested: string;
  awardAddress: string;

  github?: string;
  website?: string;
  projectPlan?: string;
  projectTimeline?: string;
  teamBackgrounds?: string;
  totalBudget?: string;
  otherFunding?: string;
}
interface GovernanceProposalType {
  kind: 'governance';
  oldValue: any;
  newValue: any;
  type: any;
  key: any;
}
type ProposalType = GrantProposalType | GovernanceProposalType;

// state
interface IProposal {
  type: ProposalType;
  id: number;
  proposalIDs: number[];
  requestIDs: number[];
}

const grantProposal: IProposal = {
  type: {
    kind: 'grant',
    tokensRequested: 5000,
  },
  id: 5,
  requestID: 6,
};

const governanceProposal: IProposal = {
  type: {
    kind: 'governance',
    oldValue: '432143',
    newValue: '4321',
    type: 'number',
    key: 'slateStakeAmount',
  },
  id: 5,
  requestID: 6,
};
```
