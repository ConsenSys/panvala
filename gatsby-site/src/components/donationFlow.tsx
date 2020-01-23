import React from 'react';
import { providers, constants, utils } from 'ethers';

import {
  BN,
  checkAllowance,
  fetchEthPrice,
  quoteUsdToEth,
  getGasPrice,
  quoteEthToPan,
  getEndpointAndHeaders,
  postDonation,
  formatDonation,
  postAutopilot,
  IMetadata,
  IAutopilotDonation,
  IDonationTx,
  IAPIDonation,
} from '../utils/donate';
import { loadContracts, getEnvironment, Environment } from '../utils/env';

const { parseEther, hexlify, getAddress, bigNumberify } = utils;

declare global {
  interface Window {
    ethereum: any;
  }
}

interface DonationState {
  selectedAccount: string;
  panPurchased: number;
  step: null | string;
  message: string;
  error: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

interface ExtraData {
  fundraiser?: string;
  message?: string;
}

interface DonationMetadata {
  monthlyPledge: any;
  pledgeDuration: string;
  memo: string;
}

export interface IDonationFlowData {
  userData: UserData;
  donationMetadata: DonationMetadata;
  extraData?: ExtraData;
  pledgeType: string;
  donationTier: string;
}

export const withDonationFlow = WrappedComponent => {
  return class extends React.Component {
    state: DonationState;
    provider: any;
    exchange: any;
    token: any;
    tokenCapacitor: any;

    constructor(props) {
      super(props);
      this.state = {
        // current Ethereum account
        selectedAccount: '',
        // amount of PAN purchased
        panPurchased: 0,
        // status
        step: null,
        message: '',
        error: false,
      };

      // bind so we can pass them as props to the wrapped component
      this.handleCancel = this.handleCancel.bind(this);
      this.handleDonation = this.handleDonation.bind(this);

      this.provider = undefined;
      this.exchange = undefined;
      this.token = undefined;
      this.tokenCapacitor = undefined;
    }

    // ---------------------------------------------------------------------------
    // Initialize
    // ---------------------------------------------------------------------------

    async componentDidMount() {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        // Listen for network changes -> reload page
        window.ethereum.on('networkChanged', network => {
          console.log('MetaMask network changed:', network);
          window.location.reload();
        });
      }
    }

    // Setup provider & selected account
    async setSelectedAccount(): Promise<string | void> {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        if (!this.provider) {
          this.provider = new providers.Web3Provider(window.ethereum);
        }
        let selectedAccount = (await this.provider.listAccounts())[0];
        // user not enabled for this app
        if (!selectedAccount) {
          try {
            selectedAccount = (await window.ethereum.enable())[0];
          } catch (error) {
            if (error.stack.includes('User denied account authorization')) {
              const msg =
                'MetaMask not enabled. In order to donate pan, you must authorize this app.';
              this.handleError(msg);
            }
          }
        }
        this.setState({ selectedAccount });
        return selectedAccount;
      } else {
        this.handleError('MetaMask not found. Please download MetaMask @ metamask.io');
      }
    }

    // Setup contracts
    async setContracts(): Promise<void> {
      if (typeof this.provider !== 'undefined') {
        try {
          await this.checkNetwork();
        } catch (error) {
          console.error(`ERROR: ${error.message}`);
          throw error;
        }

        const { token, tokenCapacitor, exchange } = await loadContracts(this.provider);
        this.token = token;
        this.tokenCapacitor = tokenCapacitor;
        this.exchange = exchange;
      } else {
        // No provider yet
        const account = await this.setSelectedAccount();
        if (account) {
          await this.setContracts();
        } else {
          // Invalid provider / provider not enabled for this site
          const msg = 'You must login to MetaMask';
          console.error(msg);
          throw new Error(msg);
        }
      }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    // Check that provider & contracts are setup correctly
    async checkEthereum(): Promise<string | void> {
      let account;
      try {
        account = getAddress(this.state.selectedAccount);
      } catch {
        account = await this.setSelectedAccount();
        if (!account) {
          const errMsg = 'You must be logged into MetaMask.';
          this.handleError(errMsg);
        }
      }

      if (typeof this.token === 'undefined') {
        try {
          await this.setContracts();
        } catch (error) {
          console.error(`ERROR : ${error.message}`);
          this.handleError(error.message);
        }
        if (typeof this.token === 'undefined') {
          const errMsg = 'Contracts not set correctly.';
          this.handleError(errMsg);
        }
      }
    }

    async checkNetwork(): Promise<void> {
      let errMsg;
      if (!this.state.selectedAccount || !this.provider) {
        const account = await this.setSelectedAccount();
        if (!account) {
          this.handleError('Ethereum not setup properly.');
        }
      }

      // Use Rinkeby for anything non-production
      const env = getEnvironment();
      const correctChainId = env === Environment.production ? 1 : 4;

      const network = await this.provider.getNetwork();
      const supportedNetworks = {
        1: 'Main',
        4: 'Rinkeby',
      };

      if (network.chainId !== correctChainId) {
        errMsg = `Metamask is connected to an unsupported network. Please connect to the ${supportedNetworks[correctChainId]} network.`;
        this.handleError(errMsg);
      }
    }

    async connectWallet(): Promise<void> {
      console.log('connect wallet');
      await this.setSelectedAccount();
      await this.setContracts();
      await this.checkEthereum();
      console.log('success', this.provider);
    }

    // PAN
    async getQuote(value: utils.BigNumber) {
      return quoteEthToPan(value, this.provider, {
        token: this.token,
        exchange: this.exchange,
      });
    }

    async createDonationMetadata(monthlyPledge: string, pledgeDuration: string, memo: string) {
      // Calculate pledge total value (monthly * term)
      const pledgeMonthlyUSD: number = parseInt(monthlyPledge, 10);
      const pledgeTerm: number = parseInt(pledgeDuration, 10);
      const pledgeTotal: utils.BigNumber = BN(pledgeMonthlyUSD).mul(pledgeTerm);

      // Get USD price of 1 ETH
      const ethPrice = await fetchEthPrice();

      // Convert USD to ETH, print
      const ethAmount = quoteUsdToEth(pledgeTotal, ethPrice).toString();
      console.log(`${pledgeTotal} USD -> ${ethAmount} ETH`);

      // Convert to wei, print
      const weiAmount = parseEther(ethAmount);
      const panValue = await this.getQuote(weiAmount);

      // PAN bought w/ 1 ETH
      await this.getQuote(parseEther('1'));

      // Build donation object
      const donation: IMetadata = {
        version: '1',
        memo: memo || '',
        usdValue: BN(pledgeTotal).toString(),
        ethValue: weiAmount.toString(),
        pledgeMonthlyUSD,
        pledgeTerm,
      };

      return { metadata: donation, panValue };
    }

    // Sell ETH -> uniswap exchange (buy PAN)
    async purchasePan(donation: IMetadata, panValue: utils.BigNumber): Promise<utils.BigNumber> {
      // TODO: subtract a percentage
      const minTokens = BN(panValue).sub(5000);
      const block = await this.provider.getBlock();
      const deadline = BN(block.timestamp).add(3600); // add one hour

      // Buy Pan with Eth
      try {
        this.setState({
          message: 'Purchasing PAN from Uniswap...',
        });

        const gasPrice = await getGasPrice();
        const ethValue = BN(donation.ethValue);

        const tx = await this.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
          value: hexlify(ethValue),
          gasLimit: hexlify(150000),
          gasPrice: gasPrice || hexlify(12e9),
        });
        console.log('tx:', tx);

        this.setState({
          message: 'Waiting for transaction confirmation...',
        });

        // Wait for tx to get mined
        await this.provider.waitForTransaction(tx.hash);

        // TODO: maybe wait for blocks

        const receipt = await this.provider.getTransactionReceipt(tx.hash);
        console.log('receipt:', receipt);
        console.log();

        // Get new quote
        console.log('NEW QUOTE');
        await this.getQuote(ethValue);
        await this.getQuote(parseEther('1'));
        return panValue;
      } catch (error) {
        console.error(`ERROR: ${error.message}`);
        this.handleError(`Uniswap transaction failed: ${error.message}`);
        return bigNumberify('0');
      }
    }

    // Donate PAN -> Token Capacitor
    // Approve if necessary
    async donatePan(multihash: string, tier: string): Promise<IDonationTx | void> {
      // Exit if user did not complete ETH -> PAN swap
      if (!this.state.panPurchased) {
        this.handleError('No PAN was purchased, not donating');
      }

      // Check allowance
      const allowed = await checkAllowance(
        this.token,
        this.state.selectedAccount,
        this.tokenCapacitor.address,
        this.state.panPurchased
      );

      try {
        // if necessary, approve token capacitor to spend
        if (!allowed) {
          this.setState({
            message: 'Approving tokens...',
          });

          const approveTx = await this.token.functions.approve(
            this.tokenCapacitor.address,
            constants.MaxUint256
          );
          console.log('approval', approveTx.hash);
        }

        // Donate PAN to token capacitor
        this.setState({
          message: 'Donating PAN...',
        });

        const gasPrice = await getGasPrice();
        const donor = this.state.selectedAccount;
        const donateTx = await this.tokenCapacitor.functions.donate(
          donor,
          this.state.panPurchased,
          Buffer.from(multihash),
          {
            gasLimit: hexlify(150000), // 150K
            gasPrice: gasPrice || hexlify(12e9), // 12 GWei
          }
        );
        console.log('donation', donateTx.hash);

        // Wait for donate tx to be mined - it will always be after the approval
        this.setState({
          message: 'Waiting for transaction confirmation...',
        });

        await this.provider.waitForTransaction(donateTx.hash);

        this.setState({
          step: 3,
          message: tier,
        });

        // Return tx info
        return {
          txHash: donateTx.hash,
          metadataHash: multihash,
          donor,
          sender: donor,
          tokens: this.state.panPurchased.toString(),
        };
      } catch (error) {
        console.error(`ERROR: ${error.message}`);
        this.handleError(`Donate transaction failed: ${error.message}`);
      }
    }

    // Pass the error up to the caller and cancel everything
    handleError(msg: string) {
      this.setState({
        error: msg,
        step: null,
        message: '',
      });
      console.error(msg);
      throw new Error(msg);
    }

    // Cancel the donation flow
    handleCancel() {
      this.setState({
        step: null,
        message: '',
      });
    }

    // Execute the donation flow, throwing on error
    async handleDonation(data: IDonationFlowData, actions) {
      // console.log('data', data);
      // TODO: validate submitted data

      const { userData, donationMetadata, donationTier, pledgeType, extraData: extra } = data;
      const extraData = extra || {};

      try {
        /// 1. Connect, save metadata to IPFS, purchase PAN
        this.setState({
          step: 1,
          message: '',
        });
        await this.connectWallet();

        const { monthlyPledge, pledgeDuration, memo } = donationMetadata;
        const { metadata, panValue } = await this.createDonationMetadata(
          monthlyPledge,
          pledgeDuration,
          memo
        );

        console.log('donation metadata:', metadata);

        // Add to ipfs
        this.setState({ message: 'Saving metadata...' });

        const { endpoint, headers } = getEndpointAndHeaders();
        const url = `${endpoint}/api/ipfs`;
        const data = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(metadata),
          headers,
        });

        const multihash = await data.json();
        console.log('multihash:', multihash);

        // Purchase Panvala pan
        const panPurchased: utils.BigNumber = await this.purchasePan(metadata, panValue);

        /// 2. Approve if necessary, donate PAN, save to API, autopilot
        if (panPurchased.gt('0') && this.state.step != null) {
          this.setState({
            step: 2,
            message: 'Checking allowance...',
            panPurchased,
          });

          // Donate Panvala pan
          const txInfo: IDonationTx = (await this.donatePan(
            multihash,
            donationTier
          )) as IDonationTx;
          const { txHash } = txInfo;
          if (txHash) {
            // save donation data to API
            const formattedDonation: IAPIDonation = formatDonation(txInfo, metadata, userData, extraData);
            console.log('donation data', formattedDonation);
            await postDonation(formattedDonation);

            // save data to autopilot
            const txData: IAutopilotDonation = {
              ...metadata,
              txHash,
              multihash,
            };
            await postAutopilot(
              userData.email,
              userData.firstName,
              userData.lastName,
              txData,
              pledgeType
            );

            // done, clear the form
            actions.resetForm();
          } else {
            throw new Error('Transaction failed');
          }
        }
      } catch (error) {
        // let the caller handle errors
        console.error(`ERROR: ${error.message}`);
        this.handleError(error.message);
      }
    }

    render() {
      // Filter out extra props that are specific to this HOC and shouldn't be
      // passed through
      const { ...passThroughProps } = this.props;

      return (
        <WrappedComponent
          onDonate={this.handleDonation}
          onCancel={this.handleCancel}
          message={this.state.message}
          step={this.state.step}
          {...passThroughProps}
        />
      );
    }
  };
};
