```ts
type IResourceTypes = 'GRANT' | 'GOVERNANCE';

interface IContext {
  currentEpoch: string;
  now: number;
  contracts: {
    token: Token;
    gatekeeper: Gatekeeper;
    tokenCapacitor: TokenCapacitor;
    parameterStore: ParameterStore;
  };
  resources: {
    byAddress: {
      [address: string]: IResourceTypes;
    };
    byType: {
      [type: IResourceTypes]: string;
    };
  };
  epochs: {
    byID: {
      [id: string]: {
        id: string;
        startTime: number;
        votingOpenDate: number;
        votingCloseDate: number;
        committed: boolean;
        revealed: boolean;
        contests: {
          [resource: IResourceTypes]: {
            slateSubmissionDeadline: number;
            slates: number[];
            stakedSlates: number[];
            winner: number;
            status: {
              asNumber: 0 | 1 | 2 | 3;
              asString: 'Unstaked' | 'Staked' | 'Rejected' | 'Accepted';
            };
          };
        };
        slates: {
          byID: {
            [id: string]: {
              id: number;
              category: IResourceTypes;
              status: SlateStatus;
              owner: string;
              description: string;
              incumbent: true;
              proposals: IProposal[];
            };
          };
          allIDs: string[];
        };
        grantProposals: IGrantProposal[];
        governanceProposals: IGovernanceProposal[];
      };
    };
    allIDs: string[];
  };
  ballot: {
    voter: string;
    committer: string;
    choices: {
      [resource: string]: {
        firstChoice: number;
        secondChoice: number;
      };
    };
  };
  user: {
    signedIn: true;
    address: string;
    notifications: INotification[];
    balances: {
      walletPanBalance: string;
      votingRights: string;
      totalPanBalance: string;
      gkAllowance: string;
      tcAllowance: string;
    };
  };
  chain: {
    id: number;
    network: 'rinkeby' | 'mainnet' | 'unknown';
    balances: {
      gkBalance: string;
      tcBalance: string;
    };
    parameters: {
      slateStakeAmount: string;
      gatekeeperAddress: string;
    };
  };
}

const context: IContext = {
  currentEpoch: '1',
  now: 54245231, // if connected to MM, use block.timestamp; otherwise use browser timestamp
  contracts: {
    token: {},
  },
  resources: {
    byID: {
      resource1: {
        id: 'resource1',
        type: 'GRANT',
      },
      resource2: {
        id: 'resource2',
        type: 'GOVERNANCE',
      },
    },
    byType: {
      GRANT: 'resource1',
      GOVERNANCE: 'resource2',
    },
    allIDs: ['resource1', 'resource2'],
  },
  epochs: {
    byID: {
      '0': {
        id: '0',
        timing: {
          startTime: 1234,
          votingOpenDate: 2000,
          votingCloseDate: 3000,
        },
        committed: true,
        revealed: true,
        contests: {
          resource1: {
            slateSubmissionDeadline: 9000,
            slates: [0, 1],
            stakedSlates: [0, 1],
            winner: 0,
            status: {
              asNumber: 4,
              asString: 'Rejected',
            },
          },
          resource2: {
            slateSubmissionDeadline: 9000,
            slates: [2, 3],
            stakedSlates: [2, 3],
            winner: 2,
            status: {
              asNumber: 4,
              asString: 'Rejected',
            },
          },
        },
        slates: {
          byID: {
            '0': {
              id: 0,
              category: 'GRANT',
              status: 4,
              owner: '0x42314',
              description: 'fdsafdsafdsf',
              incumbent: true,
              proposals: [],
            },
          },
          allIDs: ['0', '1'],
        },
        grantProposals: [],
        governanceProposals: [],
      },
    },
    allIDs: ['0', '1'],
  },
  ballot: {
    voter: '0x...',
    committer: '0x...',
    choices: {
      resource1: {
        firstChoice: 0,
        secondChoice: 1,
      },
      resource2: {
        firstChoice: 2,
        secondChoice: 3,
      },
    },
  },
  user: {
    signedIn: true,
    address: '0x...',
    notifications: [],
    balances: {
      walletPanBalance: '10000',
      votingRights: '2000',
      totalPanBalance: '12000',
      gkAllowance: '12000',
      tcAllowance: '12000',
    },
  },
  chain: {
    id: 4,
    network: 'rinkeby',
    balances: {
      gkBalance: '52341',
      tcBalance: '4231',
    },
    parameters: {
      slateStakeAmount: '4321',
      gatekeeperAddress: '0x321',
    },
  },
};
```
