import * as React from 'react';
import { utils, providers } from 'ethers';
import { toast } from 'react-toastify';
import isEmpty from 'lodash/isEmpty';
import getConfig from 'next/config';
import { connectProvider, connectContracts } from '../utils/provider';
import { IContracts } from '../interfaces';
import { baseToConvertedUnits, BN } from '../utils/format';
import {
  saveState,
  loadState,
  ENABLED_ACCOUNTS,
  saveSessionState,
  CLOSED_MAINNET_MODAL,
  loadSessionState,
} from '../utils/localStorage';
import MainnetModal from './MainnetModal';
const { publicRuntimeConfig = {} } = getConfig() || {};

export interface IEthereumContext {
  account: string;
  ethProvider: providers.Web3Provider;
  contracts: IContracts;
  panBalance: utils.BigNumber;
  gkAllowance: utils.BigNumber;
  tcAllowance: utils.BigNumber;
  votingRights: utils.BigNumber;
  slateStakeAmount: utils.BigNumber;
  onRefreshBalances(): void;
}
export const EthereumContext: React.Context<IEthereumContext> = React.createContext<any>({});

// extend the global object to include ethereum (metamask ethereum provider)
declare global {
  interface Window {
    ethereum: any;
  }
}

function reducer(state: any, action: any) {
  switch (action.type) {
    case 'chain':
      return {
        ...state,
        ethProvider: action.ethProvider,
        account: action.account,
      };
    case 'contracts':
      return {
        ...state,
        contracts: action.contracts,
        slateStakeAmount: action.slateStakeAmount,
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

const EthereumProvider: React.FC<any> = (props: any) => {
  const [state, dispatch] = React.useReducer(reducer, {
    ethProvider: {},
    contracts: {
      gatekeeper: {},
      tokenCapacitor: {},
      token: {},
      parameterStore: {},
    },
    account: '',
    panBalance: BN('0'),
    gkAllowance: BN('0'),
    tcAllowance: BN('0'),
    votingRights: BN('0'),
    tcBalance: BN('0'),
    gkBalance: BN('0'),
    slateStakeAmount: BN('0'),
  });

  // runs once, on-load
  // 1. get metamask / set account / set provider
  // 2. set contracts
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
            throw error;
          }

          // selected account
          const account = utils.getAddress(addresses[0]);

          // register an event listener to handle account-switching in metamask
          ethereum.once('accountsChanged', (accounts: string[]) => {
            console.info('MetaMask account changed:', accounts[0]);
            handleConnectEthereum();
          });

          // register an event listener to handle network-switching in metamask
          ethereum.once('networkChanged', (network: any) => {
            console.info('MetaMask network changed:', network);
            window.location.reload();
          });

          try {
            // wrap MetaMask with ethers
            const ethProvider = await connectProvider(ethereum);
            console.log('account:', account);

            dispatch({
              type: 'chain',
              ethProvider,
              account,
            });

            if (!isEmpty(ethProvider)) {
              await setupContracts(ethProvider);
            }
          } catch (error) {
            console.error(`ERROR failed to connect eth provider: ${error.message}`);
            throw error;
          }

          async function setupContracts(ethProvider) {
            // contract abstractions (w/ metamask signer)
            try {
              const contracts = await connectContracts(ethProvider);
              const slateStakeAmount = await contracts.parameterStore.functions.getAsUint(
                'slateStakeAmount'
              );
              console.log('contracts:', contracts);

              dispatch({
                type: 'contracts',
                contracts,
                slateStakeAmount,
              });
            } catch (error) {
              console.error(`ERROR failed to connect contracts: ${error.message}`);
              if (error.message.includes('contract not deployed')) {
                toast.error(`Contracts not deployed on current network`);
              } else if (error.message.includes('Wrong network')) {
                toast.error(error.message);
              }
              throw error;
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    handleConnectEthereum();

    // clean up
    return () =>
      typeof window !== 'undefined' &&
      typeof window.ethereum !== 'undefined' &&
      window.ethereum.removeAllListeners();
  }, []);

  async function handleRefreshBalances() {
    const {
      account,
      contracts: { token, gatekeeper, tokenCapacitor },
    } = state;
    if (account && !isEmpty(token) && !isEmpty(gatekeeper)) {
      // prettier-ignore
      const [panBalance, gkAllowance, tcAllowance, votingRights, tcBalance, gkBalance] = await Promise.all([
        token.functions.balanceOf(account),
        token.functions.allowance(account, gatekeeper.address),
        token.functions.allowance(account, tokenCapacitor.address),
        gatekeeper.functions.voteTokenBalance(account),
        token.functions.balanceOf(tokenCapacitor.address),
        token.functions.balanceOf(gatekeeper.address),
      ]);
      const balances = {
        panBalance,
        gkBalance,
        tcBalance,
        gkAllowance,
        tcAllowance,
        votingRights,
      };
      const converted = {
        votingRights: baseToConvertedUnits(votingRights),
        balance: baseToConvertedUnits(panBalance),
        gatekeeper: baseToConvertedUnits(gkBalance),
        tokenCapacitor: baseToConvertedUnits(tcBalance),
        gkAllowance: baseToConvertedUnits(gkAllowance),
        tcAllowance: baseToConvertedUnits(tcAllowance),
      };
      console.log('balances:', converted);
      dispatch({
        type: 'balances',
        payload: balances,
      });
    }
  }

  // runs whenever account changes
  React.useEffect(() => {
    if (state.account && !isEmpty(state.contracts.token)) {
      console.info('Refreshing balances for:', state.account.slice(0, 10));
      handleRefreshBalances();
    }
  }, [state.account, state.contracts.token]);

  // render warning modal if on mainnet
  const [modalIsOpen, setMainnetModalOpen] = React.useState(false);
  React.useEffect(() => {
    async function checkNetwork() {
      const network = await state.ethProvider.getNetwork();
      if (network.chainId === 1 || publicRuntimeConfig.panvalaEnv === 'production') {
        const sessionState = loadSessionState(CLOSED_MAINNET_MODAL);
        if (sessionState !== 'TRUE') {
          setMainnetModalOpen(true);
        }
      }
    }

    if (!isEmpty(state.ethProvider)) {
      checkNetwork();
    }
  }, [state.ethProvider]);

  const ethContext: IEthereumContext = {
    ...state,
    onRefreshBalances: handleRefreshBalances,
  };

  function closeModal() {
    saveSessionState(CLOSED_MAINNET_MODAL, 'TRUE');
    setMainnetModalOpen(false);
  }

  return (
    <EthereumContext.Provider value={ethContext}>
      {props.children}

      <MainnetModal modalIsOpen={modalIsOpen} handleClick={closeModal} />
    </EthereumContext.Provider>
  );
};

export default React.memo(EthereumProvider);
