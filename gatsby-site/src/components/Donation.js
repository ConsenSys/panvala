import React, { Component } from 'react';
import { providers, constants, Contract, utils } from 'ethers';
import 'whatwg-fetch';

import WebsiteModal from './WebsiteModal';
import DonateButton from './DonateButton';

import { tcAbi, tokenAbi, exchangeAbi } from '../utils/abis';
import {
  BN,
  checkAllowance,
  fetchEthPrice,
  quoteUsdToEth,
  getEndpointAndHeaders,
  getTier,
  getGasPrice,
  postAutopilot,
} from '../utils/donate';

const { formatEther, parseEther, formatUnits, hexlify, getAddress } = utils;

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
    this.handleClickDonate = this.handleClickDonate.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------

  async componentDidMount() {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      // Listen for network changes -> reload page
      window.ethereum.once('networkChanged', network => {
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
        window.ethereum
          .enable()
          .then(enabled => {
            selectedAccount = enabled[0];
          })
          .catch(error => {
            if (error.stack.includes('User denied account authorization')) {
              alert('MetaMask not enabled. In order to donate pan, you must authorize this app.');
            }
          });
      }
      this.setState({ selectedAccount });
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
      const { chainId } = await this.provider.getNetwork();
      const signer = this.provider.getSigner();

      // Addresses
      const tokenAddress =
        chainId === 4
          ? '0x4912d6aBc68e4F02d1FdD6B79ed045C0A0BAf772'
          : chainId === 1 && '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44';
      const tcAddress =
        chainId === 4
          ? '0xA062C59F42a45f228BEBB6e7234Ed1ea14398dE7'
          : chainId === 1 && '0x9a7B675619d3633304134155c6c976E9b4c1cfB3';
      const exchangeAddress =
        chainId === 4
          ? '0x25EAd1E8e3a9C38321488BC5417c999E622e36ea'
          : chainId === 1 && '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7';

      // Get codes
      const tokenCode = await this.provider.getCode(tokenAddress);
      const tcCode = await this.provider.getCode(tcAddress);
      const exchangeCode = await this.provider.getCode(exchangeAddress);

      // prettier-ignore
      if (!tokenAddress || !tcAddress || !exchangeAddress || !tokenCode || !tcCode || !exchangeCode) {
        throw new Error('Invalid address or no code at address.')
      }

      // Init token, token capacitor, uniswap exchange contracts
      this.token = new Contract(tokenAddress, tokenAbi, signer);
      this.tokenCapacitor = new Contract(tcAddress, tcAbi, signer);
      this.exchange = new Contract(exchangeAddress, exchangeAbi, signer);
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
      alert('Ethereum not setup properly.');
      throw new Error('Ethereum not setup properly.');
    }

    const correctChainId = window.location.href.includes('panvala.com/donate') ? 1 : 4;
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

  // Sell order (exact input) -> calculates amount bought (output)
  async quoteEthToPan(etherToSpend) {
    console.log('');
    // Sell ETH for PAN
    const ethAmount = BN(etherToSpend);

    // ETH reserve
    const inputReserve = await this.provider.getBalance(this.exchange.address);
    console.log(`ETH reserve: ${formatEther(inputReserve)}`);

    // PAN reserve
    const outputReserve = await this.token.balanceOf(this.exchange.address);
    console.log(`PAN reserve: ${formatUnits(outputReserve, 18)}`);

    const numerator = ethAmount.mul(outputReserve).mul(997);
    const denominator = inputReserve.mul(1000).add(ethAmount.mul(997));
    const panToReceive = numerator.div(denominator);

    console.log(
      `quote ${formatEther(ethAmount)} ETH : ${formatUnits(panToReceive.toString(), 18)} PAN`
    );
    // EQUIVALENT, DIRECT CHAIN CALL
    // PAN bought w/ input ETH
    // const panToReceive = await this.exchange.getEthToTokenInputPrice(ethAmount);
    // console.log(`${formatEther(ethAmount)} ETH -> ${formatUnits(panToReceive, 18)} PAN`);
    return panToReceive;
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  // Click handler for donations
  async handleClickDonate(e) {
    e.preventDefault();

    const pledgeFirstName = document.getElementById('pledge-first-name');
    const pledgeLastName = document.getElementById('pledge-last-name');
    const pledgeEmail = document.getElementById('pledge-email');
    const pledgeMonthlySelect = document.getElementById('pledge-tier-select');
    const pledgeTermSelect = document.getElementById('pledge-duration-select');

    if (pledgeFirstName.value === '') {
      alert('You must enter a first name.');
      return;
    }
    if (pledgeEmail.value === '') {
      alert('You must enter an email address.');
      return;
    }
    if (pledgeMonthlySelect.value === '0') {
      alert('You must select a pledge tier.');
      return;
    }
    if (pledgeTermSelect.value === '0') {
      alert('You must select a pledge duration.');
      return;
    }

    // Make sure ethereum is hooked up properly
    try {
      await this.setSelectedAccount();
      await this.setContracts();
      await this.checkEthereum();
    } catch (error) {
      console.error(error);
      return error;
    }

    const tier = getTier(pledgeMonthlySelect.value);
    this.setState({
      tier,
      email: pledgeEmail.value,
      firstName: pledgeFirstName.value,
      lastName: pledgeLastName.value,
      step: 1,
      message: 'Adding metadata to IPFS...',
    });

    // Calculate pledge total value (monthly * term)
    const pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
    const pledgeTerm = parseInt(pledgeTermSelect.value, 10);
    const pledgeTotal = BN(pledgeMonthlyUSD).mul(pledgeTerm);

    // Get USD price of 1 ETH
    const ethPrice = await fetchEthPrice();

    // Convert USD to ETH, print
    const ethAmount = quoteUsdToEth(pledgeTotal, ethPrice).toString();
    console.log(`${pledgeTotal} USD -> ${ethAmount} ETH`);

    // Convert to wei, print
    const weiAmount = parseEther(ethAmount);
    const panValue = await this.quoteEthToPan(weiAmount);

    // PAN bought w/ 1 ETH
    await this.quoteEthToPan(parseEther('1'));

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
          pledgeFirstName.value = '';
          pledgeLastName.value = '';
          pledgeEmail.value = '';
          pledgeMonthlySelect.value = '0';
          pledgeTermSelect.value = '0';
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
      await this.quoteEthToPan(donation.ethValue);
      await this.quoteEthToPan(parseEther('1'));
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
        // Donate PAN to token capacitor
        const donateTx = await this.tokenCapacitor.functions.donate(
          this.state.selectedAccount,
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
        <DonateButton handleClick={this.handleClickDonate} />
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
