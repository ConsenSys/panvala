import * as React from 'react';
import { utils, providers } from 'ethers';
import { toast } from 'react-toastify';
import isEmpty from 'lodash/isEmpty';
import { connectProvider, connectContracts } from '../utils/provider';
import { IContracts } from '../interfaces';
import { baseToConvertedUnits } from '../utils/format';
import { saveState, loadState, ENABLED_ACCOUNTS } from '../utils/localStorage';

export interface IEthereumContext {
  account: string;
  ethProvider: providers.Web3Provider;
  contracts: IContracts;
  panBalance: utils.BigNumber;
  gkAllowance: utils.BigNumber;
  tcAllowance: utils.BigNumber;
  votingRights: utils.BigNumber;
  slateStakeAmount: utils.BigNumber;
  onRefreshBalances(): any;
}
export const EthereumContext: React.Context<IEthereumContext> = React.createContext<any>({});

// extend the global object to include ethereum (metamask ethereum provider)
declare global {
  interface Window {
    ethereum: any;
  }
}

async function getBalances(account: string, contracts: IContracts): Promise<any[]> {
  return Promise.all([
    contracts.token.functions.balanceOf(account),
    contracts.token.functions.allowance(account, contracts.gatekeeper.address),
    contracts.token.functions.allowance(account, contracts.tokenCapacitor.address),
    contracts.gatekeeper.functions.voteTokenBalance(account),
    contracts.token.functions.balanceOf(contracts.tokenCapacitor.address),
    contracts.token.functions.balanceOf(contracts.gatekeeper.address),
  ]);
}

function reducer(state: any, action: any) {
  console.info(`Eth state change (${action.type})`, state, action);
  switch (action.type) {
    // case 'all':
    //   return action.payload;
    case 'eth_state':
      return {
        ...state,
        ethProvider: action.ethProvider,
        contracts: action.contracts,
        account: action.account,
        slateStakeAmount: action.slateStakeAmount,
      };
    case 'account':
      return {
        ...state,
        account: action.payload,
      };
    case 'balances':
      return {
        ...state,
        ...action.payload,
      };
    default: {
      console.error('Unknown action type provided to Eth Provider', action);
      return state;
    }
  }
}

export default function EthereumProvider(props: any) {
  const [state, dispatch] = React.useReducer(reducer, {
    ethProvider: {},
    contracts: {},
    account: '',
    panBalance: utils.bigNumberify('0'),
    gkAllowance: utils.bigNumberify('0'),
    tcAllowance: utils.bigNumberify('0'),
    votingRights: utils.bigNumberify('0'),
    tcBalance: utils.bigNumberify('0'),
    gkBalance: utils.bigNumberify('0'),
    panHuman: utils.bigNumberify('0'),
    gkHuman: utils.bigNumberify('0'),
    tcHuman: utils.bigNumberify('0'),
    slateStakeAmount: utils.bigNumberify('0'),
  });

  // runs once, on-load
  React.useEffect(() => {
    async function handleConnectEthereum() {
      try {
        if (typeof window !== 'undefined' && window.hasOwnProperty('ethereum')) {
          // this means metamask is installed. get the ethereum provider
          const { ethereum }: Window = window;
          // pop-up metamask to authorize panvala-app (account signature validation)
          let addresses: string[] = [];
          try {
            addresses = await ethereum.enable();
            let enabledAccounts = loadState(ENABLED_ACCOUNTS);
            if (enabledAccounts && !enabledAccounts.includes(addresses[0])) {
              enabledAccounts = enabledAccounts.concat(addresses[0]);
            } else if (!enabledAccounts) {
              enabledAccounts = addresses;
            }
            saveState(ENABLED_ACCOUNTS, enabledAccounts);
          } catch (error) {
            console.error(`ERROR failed to enable metamask: ${error.message}`);
          }
          // selected account
          const account = utils.getAddress(addresses[0]);
          // wrap MetaMask with ethers
          let ethProvider: providers.Web3Provider | {} = {};
          try {
            ethProvider = await connectProvider(ethereum);
          } catch (error) {
            console.error(`ERROR failed to connect eth provider: ${error.message}`);
          }
          // contract abstractions (w/ metamask signer)
          let contracts: IContracts | {} = {};
          try {
            contracts = await connectContracts(ethProvider);
          } catch (error) {
            console.error(`ERROR failed to connect contracts: ${error.message}`);
            if (error.message.includes('contract not deployed')) {
              toast.error(`Contracts not deployed on current network`);
            }
          }
          const slateStakeAmount = await contracts.parameterStore.functions.getAsUint(
            'slateStakeAmount'
          );

          // set state
          if (account && !isEmpty(ethProvider)) {
            dispatch({
              type: 'eth_state',
              ethProvider,
              contracts,
              account,
              slateStakeAmount,
            });
            if (contracts.hasOwnProperty('token')) {
              toast.success('MetaMask successfully connected!');
            }
          }

          // register an event listener to handle account-switching in metamask
          ethereum.once('accountsChanged', (accounts: string[]) => {
            console.log('MetaMask account changed:', accounts[0]);
            handleConnectEthereum();
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Error while attempting to connect to Ethereum.');
      }
    }

    handleConnectEthereum();
  }, []);

  async function handleRefreshBalances(address: string) {
    if (address && !isEmpty(state.contracts)) {
      const [
        panBalance,
        gkAllowance,
        tcAllowance,
        votingRights,
        tcBalance,
        gkBalance,
      ] = await getBalances(address, state.contracts);
      dispatch({
        type: 'balances',
        payload: {
          panBalance,
          gkBalance,
          tcBalance,
          gkAllowance,
          tcAllowance,
          votingRights,
          panHuman: baseToConvertedUnits(panBalance),
          gkHuman: baseToConvertedUnits(gkBalance),
          tcHuman: baseToConvertedUnits(tcBalance),
        },
      });
    }
  }

  // runs whenever account changes
  React.useEffect(() => {
    if (state.account && !isEmpty(state.contracts)) {
      console.info('Refreshing balances for:', state.account.slice(0, 10));
      handleRefreshBalances(state.account);
    }
  }, [state.account]);

  const ethContext: IEthereumContext = {
    ...state,
    onRefreshBalances: () => handleRefreshBalances(state.account),
  };

  return <EthereumContext.Provider value={ethContext}>{props.children}</EthereumContext.Provider>;
}
