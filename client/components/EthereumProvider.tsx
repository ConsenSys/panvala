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

async function getBalances(account: string, contracts: IContracts): Promise<utils.BigNumber[]> {
  return Promise.all([
    contracts.token.functions.balanceOf(account),
    contracts.token.functions.allowance(account, contracts.gatekeeper.address),
    contracts.token.functions.allowance(account, contracts.tokenCapacitor.address),
    contracts.gatekeeper.functions.voteTokenBalance(account),
  ]);
}

export default function EthereumProvider(props: any) {
  const [ethState, setEthState] = React.useState({
    ethProvider: {},
    contracts: {},
    account: '',
  });
  const [balances, setBalances] = React.useState({
    panBalance: utils.bigNumberify('0'),
    gkAllowance: utils.bigNumberify('0'),
    tcAllowance: utils.bigNumberify('0'),
    votingRights: utils.bigNumberify('0'),
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
          const contracts: IContracts = await connectContracts(ethProvider);

          // set state
          if (account && ethProvider && contracts) {
            setEthState({
              ethProvider,
              contracts,
              account,
            });
            toast.success('MetaMask successfully connected!');
          }

          // register an event listener to handle account-switching in metamask
          ethereum.on('accountsChanged', (accounts: string[]) => {
            console.log('account:', accounts);
            // set state, triggers useEffect -> refreshes balances
            setEthState({
              ethProvider,
              contracts,
              account: accounts[0],
            });
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
    if (address && !isEmpty(ethState.contracts)) {
      const [panBalance, gkAllowance, tcAllowance, votingRights] = await getBalances(
        address,
        ethState.contracts
      );
      setBalances({
        panBalance,
        gkAllowance,
        tcAllowance,
        votingRights,
      });
    }
  }

  // runs whenever account changes
  React.useEffect(() => {
    console.log('account changed:', ethState.account);
    if (ethState.account && !isEmpty(ethState.contracts)) {
      handleRefreshBalances(ethState.account);
    }
  }, [ethState.account]);

  const ethContext: IEthereumContext = {
    ...ethState,
    ...balances,
    onRefreshBalances: () => handleRefreshBalances(ethState.account),
  };
  console.log('Eth context:', ethContext);

  return <EthereumContext.Provider value={ethContext}>{props.children}</EthereumContext.Provider>;
}
