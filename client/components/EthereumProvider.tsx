import * as React from 'react';
import { utils, providers } from 'ethers';
import { connectProvider, connectContracts } from '../utils/provider';
import { IContracts, IEthereumContext } from '../interfaces';

export const EthereumContext: any = React.createContext({});

declare global {
  interface Window {
    ethereum: any;
  }
}

export default class EthereumProvider extends React.Component {
  state: IEthereumContext = {
    account: '',
    ethProvider: {},
    contracts: {},
  };

  componentWillUnmount() {
    console.log('unmounting..');
  }

  // since componentDidMount will only run client-side,
  // we'll be sure to have the window object here.
  async componentDidMount() {
    try {
      if (typeof window !== 'undefined' && window.hasOwnProperty('ethereum')) {
        // this means metamask is installed. get the ethereum provider
        const { ethereum }: Window = window;
        // wrap it with ethers
        const ethProvider: providers.Web3Provider = await connectProvider(ethereum);
        // pop-up metamask to authorize panvala-app (account signature validation)
        const addresses: string[] = await ethereum.enable();
        // first account
        const account: string = utils.getAddress(addresses[0]);
        // contract abstractions (w/ metamask signer)
        const contracts: IContracts = connectContracts(ethProvider);
        // gatekeeper parameters
        const gcParametersAddress: string = await contracts.gateKeeper.functions.parameters();

        console.log('contracts:', contracts);
        console.log('gatekeeper parameters address:', gcParametersAddress);

        this.setState({
          account,
          ethProvider,
          contracts,
        });
      }
    } catch (error) {
      alert(`Error while attempting to connect to the Ethereum network... ${error.message}`);
    }
  }

  render() {
    const { account, ethProvider, contracts }: IEthereumContext = this.state;
    const { children } = this.props;

    return (
      <EthereumContext.Provider
        value={{
          // onSetAccount: this.handleSetAccount,
          account,
          ethProvider,
          contracts,
        }}
      >
        {children}
      </EthereumContext.Provider>
    );
  }
}
