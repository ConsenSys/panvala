import React, { Component } from 'react';
import { providers, constants, utils } from 'ethers';

import WebsiteModal from './WebsiteModal';
import DonationForm from './DonationForm';

import {
  BN,
  checkAllowance,
  fetchEthPrice,
  quoteUsdToEth,
  getEndpointAndHeaders,
  getTier,
  getGasPrice,
  postAutopilot,
  quoteEthToPan,
} from '../utils/donate';
import { loadContracts } from '../utils/env';

const { parseEther, hexlify, getAddress } = utils;

class Donation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      fullName: '',
      selectedAccount: '',
      step: null,
      error: false,
      message: '',
      tier: '',
      panPurchased: 0,
    };
    this.handleDonation = this.handleDonation.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
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
  async setSelectedAccount() {
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
            alert('MetaMask not enabled. In order to donate pan, you must authorize this app.');
          }
        }
      }
      await this.setState({ selectedAccount });
      return selectedAccount;
    } else {
      alert('MetaMask not found. Please download MetaMask @ metamask.io');
    }
  }

  // Setup contracts
  async setContracts() {
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
        this.setState({
          error: 'You must login to MetaMask.',
        });
        return;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Reset step / close modal
  handleCancel() {
    this.setState({
      step: null,
      message: '',
    });
  }

  // Check that provider & contracts are setup correctly
  async checkEthereum() {
    let account;
    try {
      account = getAddress(this.state.selectedAccount);
    } catch {
      account = await this.setSelectedAccount();
      if (!account) {
        const errMsg = 'You must be logged into MetaMask.';
        this.setState({
          error: errMsg,
        });
        alert(errMsg);
        throw new Error(errMsg);
      }
    }

    if (typeof this.token === 'undefined') {
      try {
        await this.setContracts();
      } catch (error) {
        console.error(`ERROR : ${error.message}`);
        throw error;
      }
      if (typeof this.token === 'undefined') {
        const errMsg = 'Contracts not set correctly.';
        this.setState({
          error: errMsg,
        });
        alert(errMsg);
        throw new Error(errMsg);
      }
    }
  }

  async checkNetwork() {
    let errMsg;
    if (!this.state.selectedAccount || !this.provider) {
      const account = await this.setSelectedAccount();
      if (!account) {
        alert('Ethereum not setup properly.');
        throw new Error('Ethereum not setup properly.');
      }
    }

    let correctChainId = window.location.href.includes('panvala.com/donate') ? 1 : 4;
    if (window.location.href.includes('develop.panvala.com/donate')) {
      correctChainId = 4;
    }
    const network = await this.provider.getNetwork();
    const supportedNetworks = {
      1: 'Main',
      4: 'Rinkeby',
    };

    if (network.chainId !== correctChainId) {
      errMsg = `Metamask is connected to an unsupported network. Please connect to the ${supportedNetworks[correctChainId]} network.`;
      alert(errMsg);
      // prevent further action
      throw new Error(errMsg);
    }
  }

  getQuote(value) {
    return quoteEthToPan(value, this.provider, { token: this.token, exchange: this.exchange });
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  // Click handler for donations
  async handleDonation(values, actions) {
    console.log('Donation:', 'handleDonation', values);

    const { firstName, lastName, email, monthlyPledge, pledgeDuration } = values;

    // Make sure ethereum is hooked up properly
    try {
      await this.setSelectedAccount();
      await this.setContracts();
      await this.checkEthereum();
    } catch (error) {
      console.error(error);
      return error;
    }

    const tier = getTier(monthlyPledge);
    this.setState({
      tier,
      email,
      firstName,
      lastName,
      step: 1,
      message: 'Adding metadata to IPFS...',
    });

    // Calculate pledge total value (monthly * term)
    const pledgeMonthlyUSD = parseInt(monthlyPledge, 10);
    const pledgeTerm = parseInt(pledgeDuration, 10);
    const pledgeTotal = BN(pledgeMonthlyUSD).mul(pledgeTerm);

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
    const donation = {
      version: '1',
      memo: '',
      usdValue: BN(pledgeTotal).toString(),
      ethValue: weiAmount.toString(),
      pledgeMonthlyUSD,
      pledgeTerm,
    };
    console.log('donation:', donation);

    try {
      // Add to ipfs
      const { endpoint, headers } = getEndpointAndHeaders();
      const url = `${endpoint}/api/ipfs`;
      const data = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(donation),
        headers,
      });

      const multihash = await data.json();
      console.log('multihash:', multihash);

      // Purchase Panvala pan
      const panPurchased = await this.purchasePan(donation, panValue);

      if (panPurchased && this.state.step != null) {
        // Progress to step 2
        await this.setState({
          panPurchased,
          step: 2,
          message: 'Checking allowance...',
        });
        // Donate Panvala pan
        const txHash = await this.donatePan(multihash);
        if (txHash) {
          const txData = {
            ...donation,
            txHash,
            multihash,
          };
          await postAutopilot(this.state.email, this.state.firstName, this.state.lastName, txData);

          actions.resetForm();
        }
      }
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      return this.setState({
        step: null,
        message: error.message,
        error: error.message,
      });
    }
  }

  // Sell ETH -> uniswap exchange (buy PAN)
  async purchasePan(donation, panValue) {
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

      const tx = await this.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
        value: hexlify(BN(donation.ethValue)),
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
      await this.getQuote(donation.ethValue);
      await this.getQuote(parseEther('1'));
      return panValue;
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      alert(`Uniswap transaction failed: ${error.message}`);
      await this.setState({
        step: null,
        message: '',
      });
      return false;
    }
  }

  // Donate PAN -> Token Capacitor
  // Approve if necessary
  async donatePan(multihash) {
    // Exit if user did not complete ETH -> PAN swap
    if (!this.state.panPurchased) {
      return this.setState({
        step: null,
        message: '',
      });
    }

    // Check allowance
    const allowed = await checkAllowance(
      this.token,
      this.state.selectedAccount,
      this.tokenCapacitor.address,
      this.state.panPurchased
    );

    if (allowed) {
      this.setState({
        message: 'Donating PAN...',
      });
      const gasPrice = await getGasPrice();
      try {
        const donor = this.state.selectedAccount;
        // Donate PAN to token capacitor
        const donateTx = await this.tokenCapacitor.functions.donate(
          donor,
          this.state.panPurchased,
          Buffer.from(multihash),
          {
            gasLimit: hexlify(150000), // 150K
            gasPrice: gasPrice || hexlify(12e9), // 12 GWei
          }
        );

        // Wait for tx to be mined
        await this.provider.waitForTransaction(donateTx.hash);

        this.setState({
          step: 3,
          message: this.state.tier,
        });

        return donateTx.hash;
      } catch (error) {
        console.error(`ERROR: ${error.message}`);
        alert(`Donate transaction failed: ${error.message}`);
        await this.setState({
          step: null,
          message: '',
        });
        return false;
      }
    } else {
      this.setState({
        message: 'Approving tokens...',
      });
      // Approve token capacitor
      await this.token.functions.approve(this.tokenCapacitor.address, constants.MaxUint256);
      // Call donate again
      return this.donatePan(multihash, this.state.panPurchased);
    }
  }

  render() {
    return (
      <>
        <DonationForm onSubmit={this.handleDonation} ethPrices={this.props.ethPrices} />
        <WebsiteModal
          isOpen={true}
          step={this.state.step}
          message={this.state.message}
          handleCancel={this.handleCancel}
        />
      </>
    );
  }
}

export default Donation;
