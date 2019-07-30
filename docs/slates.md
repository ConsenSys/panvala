# Types

## Slates

```ts
// add to ipfs
interface ISlateMetadata {
  firstName: string;
  lastName?: string;
  organization?: string;
  description: string;
  proposalMultihashes: string[];
  proposals: IGovernanceProposalMetadata[] | IGrantProposalMetadata[];
}

// post to api
interface IGrantSlateForm {}
interface IGovernanceSlateForm {
  parameters: {
    [key: string]: IGovernanceProposalMetadata;
  };
}

// interface GrantSlateType {
//   kind: 'grant';
//   proposals: IProposal[];
// }
// interface GovernanceSlateType {
//   kind: 'governance';
//   proposals: IProposal[];
// }
// type SlateType = GrantSlateType | GovernanceSlateType;

// state
interface ISlate {
  // type: SlateType;
  id: number;
  epochNumber: number;
  status: number;
  description: string;
  staker: string;
  recommender: {
    address: string;
    name: string;
    verified: boolean;
    organization: string | '';
    incumbent: boolean;
  };
  proposals: IProposal[];
}

// example
const slate: ISlate = {
  // type: {
  //   kind: 'grant',
  //   proposals: [],
  // },
  id: 2,
  epochNumber: 1,
  status: 4,
  description: 'fdsafdsafdsf',
  staker: '0x42314',
  recommender: {
    address: '0x45321',
    name: 'john wick',
    verified: true,
    organization: 'panvala',
    incumbent: true,
  },
  proposals: [],
};
```
