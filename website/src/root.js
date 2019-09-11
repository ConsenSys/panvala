'use strict';

let Buffer, ipfs;

// prettier-ignore
const { formatEther, parseEther, formatUnits, hexlify, getAddress, } = ethers.utils;

class Root extends React.Component {
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
    this.token;
    this.tokenCapacitor;
    this.exchange;
    this.provider;
  }

  // Setup ipfs, call other setup functions
  async componentDidMount() {
    // helpers
    if (typeof window.IpfsHttpClient !== 'undefined') {
      const Ipfs = window.IpfsHttpClient;
      Buffer = Ipfs.Buffer;
      ipfs = new Ipfs({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    } else {
      this.setState({ error: 'Ipfs client did not setup correctly.' });
    }

    // setup ethereum
    await this.setSelectedAccount();
    await this.setContracts();
  }

  // Setup provider & selected account
  async setSelectedAccount() {
    if (typeof window.ethereum !== 'undefined') {
      if (!this.provider) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
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
            throw error;
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
      this.token = new ethers.Contract(tokenAddress, tokenAbi, signer);
      this.tokenCapacitor = new ethers.Contract(tcAddress, tcAbi, signer);
      this.exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);
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

  // Sell order (exact input) -> calculates amount bought (output)
  async quoteEthToPan(etherToSpend) {
    console.log('');
    // Sell ETH for PAN
    const ethAmount = utils.BN(etherToSpend);

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
      await this.setContracts();
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

  setTier(monthUSD) {
    console.log('monthUSD:', monthUSD);
    switch (monthUSD) {
      case '5':
        return 'Student';
      case '15':
        return 'Gold';
      case '50':
        return 'Platinum';
      case '150':
        return 'Diamond';
      case '500':
        return 'Ether';
      case '1500':
        return 'Elite';
      default:
        throw new Error('invalid tier');
    }
  }

  // Click handler for donations
  async handleClickDonate(e) {
    e.preventDefault();

    // make sure ethereum is hooked up properly
    try {
      await this.checkEthereum();
    } catch (error) {
      console.error(error);
      throw error;
    }

    const pledgeFullName = document.getElementById('pledge-full-name');
    const pledgeEmail = document.getElementById('pledge-email');
    const pledgeMonthlySelect = document.getElementById('pledge-tier-select');
    const pledgeTermSelect = document.getElementById('pledge-duration-select');

    if (pledgeFullName.value === '') {
      alert('You must enter a full name.');
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

    const tier = this.setTier(pledgeMonthlySelect.value);
    this.setState({
      tier,
      email: pledgeEmail.value,
      fullName: pledgeFullName.value,
      step: 1,
      message: 'Adding metadata to IPFS...',
    });

    // Calculate pledge total value (monthly * term)
    const pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
    const pledgeTerm = parseInt(pledgeTermSelect.value, 10);
    const pledgeTotal = utils.BN(pledgeMonthlyUSD).mul(pledgeTerm);

    // Get USD price of 1 ETH
    const ethPrice = await utils.fetchEthPrice();

    // Convert USD to ETH, print
    const ethAmount = utils.quoteUsdToEth(pledgeTotal, ethPrice).toString();
    console.log(`${pledgeTotal} USD -> ${ethAmount} ETH`);

    // Convert to wei, print
    const weiAmount = parseEther(ethAmount);
    const panValue = await this.quoteEthToPan(weiAmount);

    // PAN bought w/ 1 ETH
    await this.quoteEthToPan(parseEther('1'));

    // Build donation object
    const donation = {
      version: '1',
      memo: `Pledge donation via uniswap`,
      usdValue: utils.BN(pledgeTotal).toString(),
      ethValue: weiAmount.toString(),
      pledgeMonthlyUSD,
      pledgeTerm,
    };
    console.log('donation:', donation);

    try {
      // Add to ipfs
      const multihash = await utils.ipfsAdd(donation);
      console.log('multihash:', multihash);

      // Purchase Panvala pan
      await this.purchasePan(donation, panValue);

      // Donate Panvala pan
      const txHash = await this.donatePan(multihash);
      if (txHash) {
        const txData = {
          ...donation,
          txHash,
          multihash,
        };
        await this.postAutopilot(txData);
      }
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      return this.setState({
        message: error.message,
        error: error.message,
      });
    }
  }

  async postAutopilot(txData) {
    const postData = {
      email: this.state.email,
      fullName: this.state.fullName,
      txHash: txData.txHash,
      memo: txData.memo,
      usdValue: txData.usdValue,
      ethValue: txData.ethValue,
      pledgeMonthlyUSD: txData.pledgeMonthlyUSD,
      pledgeTerm: txData.pledgeTerm,
      multihash: txData.multihash,
    };
    const endpoint = 'http://localhost:5001';
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type',
    };
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...corsHeaders,
    };

    const url = `${endpoint}/api/website`;
    const data = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(postData),
      headers,
    });

    const json = await data.json();
    console.log('json:', json);
  }

  // Sell ETH, buy PAN
  async purchasePan(donation, panValue) {
    // TODO: subtract a percentage
    const minTokens = utils.BN(panValue).sub(5000);
    const block = await this.provider.getBlock();
    const deadline = utils.BN(block.timestamp).add(3600); // add one hour

    // Buy Pan with Eth
    try {
      this.setState({
        message: 'Purchasing PAN from Uniswap...',
      });

      const tx = await this.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
        value: hexlify(utils.BN(donation.ethValue)),
        gasLimit: hexlify(1e6),
        gasPrice: hexlify(5e9),
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

      // Progress to step 2
      return this.setState({
        panPurchased: panValue,
        step: 2,
        message: 'Checking allowance...',
      });
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    }
  }

  // Donate PAN -> token capacitor
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
    const allowed = await utils.checkAllowance(
      this.token,
      this.state.selectedAccount,
      this.tokenCapacitor.address,
      this.state.panPurchased
    );

    if (allowed) {
      this.setState({
        message: 'Donating PAN...',
      });
      // Donate PAN to token capacitor
      const donateTx = await this.tokenCapacitor.functions.donate(
        this.state.selectedAccount,
        this.state.panPurchased,
        Buffer.from(multihash),
        {
          gasLimit: hexlify(1e6), // 1 MM
          gasPrice: hexlify(5e9), // 5 GWei
        }
      );

      // Wait for tx to be mined
      await this.provider.waitForTransaction(donateTx.hash);

      this.setState({
        step: 3,
        message: this.state.tier,
      });

      return donateTx.hash;
    } else {
      this.setState({
        message: 'Approving tokens...',
      });
      // Approve token capacitor
      await this.token.functions.approve(this.tokenCapacitor.address, ethers.constants.MaxUint256);
      // Call donate again
      return this.donatePan(multihash, this.state.panPurchased);
    }
  }

  handleCancel() {
    this.setState({
      step: null,
      message: '',
    });
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

ReactDOM.render(<Root />, document.querySelector('#root_container'));
