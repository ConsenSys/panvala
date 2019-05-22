import * as React from 'react';
import { utils, providers } from 'ethers';
import { toast } from 'react-toastify';
import isEmpty from 'lodash/isEmpty';
import { connectProvider, connectContracts } from '../utils/provider';
import { IContracts, IEthereumContext } from '../interfaces';

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
  switch (action.type) {
    // case 'all':
    //   return action.payload;
    case 'eth_state':
      return {
        ...state,
        ethProvider: action.ethProvider,
        contracts: action.contracts,
        account: action.account,
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
    default:
      throw new Error();
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
  });

  // runs once, on-load
  React.useEffect(() => {
    async function handleConnectEthereum() {
      try {
        if (typeof window !== 'undefined' && window.hasOwnProperty('ethereum')) {
          // this means metamask is installed. get the ethereum provider
          const { ethereum }: Window = window;
          // pop-up metamask to authorize panvala-app (account signature validation)
          const addresses = await ethereum.enable();
          // selected account
          const account = utils.getAddress(addresses[0]);
          // wrap MetaMask with ethers
          const ethProvider: providers.Web3Provider = await connectProvider(ethereum);
          // contract abstractions (w/ metamask signer)
          let contracts: IContracts | {} = {};
          try {
            contracts = await connectContracts(ethProvider);
          } catch (error) {
            if (error.message.includes('contract not deployed')) {
              toast.error(`Contracts not deployed on current network`);
            }
          }

          // set state
          if (account && ethProvider) {
            dispatch({
              type: 'eth_state',
              ethProvider,
              contracts,
              account,
            });
            if ('token' in contracts) {
              toast.success('MetaMask successfully connected!');
            }
          }

          // register an event listener to handle account-switching in metamask
          ethereum.on('accountsChanged', (accounts: string[]) => {
            console.log('MetaMask account changed:', accounts[0]);
            // set state, triggers useEffect -> refreshes balances
            handleConnectEthereum();
            // dispatch({
            //   type: 'account',
            //   payload: accounts[0],
            // });
          });
        }
      } catch (error) {
        console.log(error);
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
          gkAllowance,
          tcAllowance,
          votingRights,
          tcBalance,
          gkBalance,
        },
      });
    }
  }

  // runs whenever account changes
  React.useEffect(() => {
    if (state.account && !isEmpty(state.contracts)) {
      console.log('account change detected. refreshing balances:', state.account);
      handleRefreshBalances(state.account);
    }
  }, [state.account]);

  const ethContext: IEthereumContext = {
    ...state,
    onRefreshBalances: () => handleRefreshBalances(state.account),
  };
  console.log('Eth context:', ethContext);

  return <EthereumContext.Provider value={ethContext}>{props.children}</EthereumContext.Provider>;
}
