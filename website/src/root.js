'use strict';

let Buffer, ipfs;

// prettier-ignore
const { bigNumberify, parseUnits, formatEther, parseEther, formatUnits, hexlify, getAddress, } = ethers.utils;

const utils = {
  BN(small) {
    return bigNumberify(small);
  },
  async checkAllowance(token, owner, spender, numTokens) {
    const allowance = await token.functions.allowance(owner, spender);
    return allowance.gte(numTokens);
  },
  async fetchEthPrice() {
    const result = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
    const json = await result.json();
    const ethPrice = json.data.amount;
    return ethPrice;
  },
  quoteUsdToEth(pledgeTotalUSD, ethPrice) {
    console.log(`1 ETH: ${ethPrice} USD`);
    return parseInt(pledgeTotalUSD, 10) / parseInt(ethPrice, 10);
  },
  ipfsAdd(obj) {
    return new Promise((resolve, reject) => {
      const data = Buffer.from(JSON.stringify(obj));

      ipfs.add(data, (err, result) => {
        if (err) reject(new Error(err));
        const { hash } = result[0];
        resolve(hash);
      });
    });
  },
};

function DonateButton({ handleClick }) {
  return (
    <div>
      <button
        onClick={handleClick}
        className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
      >
        Donate!
      </button>
    </div>
  );
}

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selectedAccount: '', error: false };
    this.handleClickDonate = this.handleClickDonate.bind(this);
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

      // Init token
      const tokenAddress =
        chainId === 4
          ? '0x4912d6aBc68e4F02d1FdD6B79ed045C0A0BAf772'
          : chainId === 1 && '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44';
      this.token = new ethers.Contract(tokenAddress, tokenAbi, signer);

      // Init token capacitor
      const tcAddress =
        chainId === 4
          ? '0xA062C59F42a45f228BEBB6e7234Ed1ea14398dE7'
          : chainId === 1 && '0x9a7B675619d3633304134155c6c976E9b4c1cfB3';
      this.tokenCapacitor = new ethers.Contract(tcAddress, tcAbi, signer);

      // Init uniswap exchange
      const exchangeAddress =
        chainId === 4
          ? '0x25EAd1E8e3a9C38321488BC5417c999E622e36ea'
          : chainId === 1 && '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7';
      this.exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);
    } else {
      const account = await this.setSelectedAccount();
      if (account) {
        await this.setContracts();
      } else {
        this.setState({
          error: 'You must login to MetaMask.',
        });
        return;
      }
    }
  }

  // Sell order (exact input) -> calculates amount bought (output)
  async quoteEthToPan(etherToSpend) {
    // Sell ETH for PAN
    const inputAmount = utils.BN(etherToSpend);

    // ETH reserve
    const inputReserve = await this.provider.getBalance(this.exchange.address);
    console.log(`ETH reserve: ${formatEther(inputReserve)}`);

    // PAN reserve
    const outputReserve = await this.token.balanceOf(this.exchange.address);
    console.log(`PAN reserve: ${formatUnits(outputReserve, 18)}`);

    const numerator = inputAmount.mul(outputReserve).mul(997);
    const denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
    const panToReceive = numerator.div(denominator);

    console.log(
      `quote ${formatEther(inputAmount)} ETH : ${formatUnits(panToReceive.toString(), 18)} PAN`
    );
    console.log('');

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

  // Steps:
  // Get element values
  // Calculate total donation
  // Fetch ETH price
  // Calculate ETH value based on total donation
  // Convert to Wei
  // Calculate PAN value based on Wei
  // Build donation object (should this go after purchasing pan?)
  // Add to ipfs
  // Purchase PAN
  // Check allowance, approve if necessary
  // Donate PAN
  async handleClickDonate(e) {
    e.preventDefault();

    // make sure ethereum is hooked up properly
    try {
      await this.checkEthereum();
    } catch (error) {
      console.error(error);
      throw error;
    }

    const pledgeMonthlySelect = document.getElementById('pledge-tier-select');
    const pledgeTermSelect = document.getElementById('pledge-duration-select');

    if (pledgeMonthlySelect.value === '0') {
      alert('You must select a pledge tier.');
      return;
    }
    if (pledgeTermSelect.value === '0') {
      alert('You must select a pledge duration.');
      return;
    }

    // Calculate pledge total value (monthly * term)
    const pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
    const pledgeTerm = parseInt(pledgeTermSelect.value, 10);
    const pledgeTotal = utils.BN(pledgeMonthlyUSD).mul(pledgeTerm);

    // Get USD price of 1 ETH
    const ethPrice = await utils.fetchEthPrice();

    // Convert USD to ETH, print
    const ethAmount = utils.quoteUsdToEth(pledgeTotal, ethPrice).toString();
    console.log(`${pledgeTotal} USD -> ${ethAmount} ETH`);
    console.log('');

    // Convert to wei, print
    const weiAmount = parseEther(ethAmount);
    const panValue = await this.quoteEthToPan(weiAmount);

    // PAN bought w/ 1 ETH
    await this.quoteEthToPan(parseEther('1'));

    // // PAN bought w/ input ETH
    // const panToReceive = await this.exchange.getEthToTokenInputPrice(weiAmount);
    // console.log(`${formatEther(inputAmount)} ETH -> ${formatUnits(panToReceive, 18)} PAN`);

    // Build donation object
    const donation = {
      version: '1',
      memo: '',
      usdValue: utils.BN(pledgeTotal).toString(),
      ethValue: weiAmount,
      pledgeMonthlyUSD,
      pledgeTerm,
    };
    console.log('donation:', donation);

    // Add to ipfs
    const multihash = await utils.ipfsAdd(donation);
    console.log('multihash:', multihash);

    // Purchase Panvala pan
    await this.purchasePan(donation, panValue);

    // Donate Panvala pan
    await this.donatePan(donation, multihash, panValue);
  }

  // Sell ETH, buy PAN
  async purchasePan(donation, panValue) {
    // TODO: subtract a percentage
    const minTokens = utils.BN(panValue).sub(5000);
    const block = await this.provider.getBlock();
    const deadline = utils.BN(block.timestamp).add(3600); // add one hour

    // Buy Pan with Eth
    const tx = await this.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
      value: hexlify(donation.ethValue),
      gasLimit: hexlify(1e6),
      gasPrice: hexlify(5e9),
    });
    console.log('tx:', tx);
    await this.provider.waitForTransaction(tx.hash);

    // TODO: maybe wait for blocks

    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    console.log('receipt:', receipt);
    console.log();

    // Get new quote
    console.log('NEW QUOTE');
    await this.quoteEthToPan(donation.ethValue);
    await this.quoteEthToPan(parseEther('1'));
  }

  // Donate PAN -> token capacitor
  // Approve if necessary
  async donatePan(donation, multihash, panValue) {
    const allowed = await utils.checkAllowance(
      this.token,
      this.state.selectedAccount,
      this.tokenCapacitor.address,
      panValue
    );
    if (allowed) {
      console.log('tokenCapacitor:', this.tokenCapacitor);
      return this.tokenCapacitor.functions.donate(
        this.state.selectedAccount,
        panValue,
        Buffer.from(multihash),
        {
          gasLimit: hexlify(1e6), // 1 MM
          gasPrice: hexlify(5e9), // 5 GWei
        }
      );
    } else {
      await this.token.functions.approve(this.tokenCapacitor.address, ethers.constants.MaxUint256);
      return this.donatePan(donation, multihash, panValue);
    }
  }

  render() {
    return (
      <div>
        <DonateButton handleClick={this.handleClickDonate} />
      </div>
    );
  }
}

ReactDOM.render(<Root />, document.querySelector('#root_container'));
