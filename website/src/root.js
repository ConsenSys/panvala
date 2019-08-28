'use strict';

let provider, ipfs, Buffer, token, tokenCapacitor, exchange;

const {
  utils: { parseEther, formatEther, parseUnits, formatUnits, bigNumberify, hexlify },
} = ethers;

function BN(small) {
  return bigNumberify(small);
}

async function checkAllowance(token, owner, spender, numTokens) {
  const allowance = await token.functions.allowance(owner, spender);
  return allowance.gte(numTokens);
}

async function fetchEthPrice() {
  const result = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
  const json = await result.json();
  const ethPrice = json.data.amount;
  return ethPrice;
}

function quotePanToEth(panAmount, ethPrice) {
  console.log(`1 ETH: ${ethPrice} PAN`);
  return parseInt(panAmount, 10) / parseInt(ethPrice, 10);
}

function quoteUsdToEth(usdAmount, ethPrice) {
  console.log(`1 ETH: ${ethPrice} USD`);
  return parseInt(usdAmount, 10) / parseInt(ethPrice, 10);
}

function ipfsAdd(obj) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(obj));

    ipfs.add(data, (err, result) => {
      if (err) reject(new Error(err));
      const { hash } = result[0];
      resolve(hash);
    });
  });
}

const Donate = ({ handleClick }) => {
  return (
    <div>
      <button
        onClick={handleClick}
        className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
      >
        Donate Now
      </button>
    </div>
  );
};

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selectedAccount: '', error: false };
    this.handleDonate = this.handleDonate.bind(this);
  }

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

  async setSelectedAccount() {
    if (typeof window.ethereum !== 'undefined') {
      if (!provider) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
      }
      let selectedAccount = (await this.provider.listAccounts())[0];
      // user not enabled for this app
      if (!selectedAccount) {
        window.ethereum.enable().then(enabled => {
          selectedAccount = enabled[0];
        });
      }
      this.setState({ selectedAccount });
      return selectedAccount;
    }
  }

  async setContracts() {
    if (typeof this.provider !== 'undefined') {
      const { chainId } = await this.provider.getNetwork();
      const signer = this.provider.getSigner();
      const tokenAddress =
        chainId === 4
          ? '0xa6208407aFA5B0995421fF608Dd84EAaA4c71AE4'
          : chainId === 1 && '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44';
      this.token = new ethers.Contract(tokenAddress, tokenAbi, signer);
      this.tokenCapacitor = new ethers.Contract(
        '0xad6E0b491F48F5fACc492b9165c0A38121202756',
        tcAbi,
        signer
      );
      const exchangeAddress =
        chainId === 4
          ? '0x103Bf69E174081321DE44cBA78F220F5d30931e8'
          : chainId === 1 && '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7';
      this.exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);
      this.queryExchange(this.exchange);
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

  queryExchange(exchange) {
    console.log('exchange:', exchange);
    // exchange.once('TokenPurchase', (buyer, eth_sold, tokens_bought) => {
    //   console.log('buyer:', buyer);
    //   console.log(`eth_sold: ${eth_sold}`);
    //   console.log(`tokens_bought: ${tokens_bought}`);
    // });
    // const ethSold = '1000000000000000000';
    // const p = await this.exchange.functions.getEthToTokenInputPrice(ethSold);
    // console.log('p.toString():', formatUnits(p.toString(), 18).toString());
  }

  // Sell order (exact input) -> calculates amount bought (output)
  async quoteEthToPan(etherToSpend) {
    // Sell ETH for PAN
    const inputAmount = etherToSpend;
    // ETH reserve
    const inputReserve = await this.provider.getBalance(this.exchange.address);
    console.log(`ETH reserve: ${inputReserve.toString()}`);
    // PAN reserve
    const outputReserve = await this.token.balanceOf(this.exchange.address);
    console.log(`PAN reserve: ${outputReserve.toString()}`);

    // Output amount bought
    const numerator = inputAmount.mul(outputReserve).mul(997);
    const denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
    const panToReceive = numerator.div(denominator);

    const rate = panToReceive.div(inputAmount);
    quotePanToEth(panToReceive, rate);

    return panToReceive;
  }

  async handleDonate(e) {
    e.preventDefault();

    // make sure ethereum is hooked up properly
    if (!this.state.selectedAccount) {
      const account = await this.setSelectedAccount();
      if (!account) {
        alert('You must be logged into MetaMask.');
        return;
      }
    }

    const pledgeTierSelect = document.getElementById('pledge-tier-select');
    const pledgeDurationSelect = document.getElementById('pledge-duration-select');

    if (pledgeTierSelect.value === '0') {
      alert('You must select a pledge tier.');
      return;
    }
    if (pledgeDurationSelect.value === '0') {
      alert('You must select a pledge duration.');
      return;
    }

    const pledgeTier = parseInt(pledgeTierSelect.value, 10);
    const pledgeDuration = parseInt(pledgeDurationSelect.value, 10);

    const usdAmount = pledgeTier * pledgeDuration;
    const ethPrice = await fetchEthPrice();
    const ethAmount = quoteUsdToEth(usdAmount, ethPrice).toString();
    console.log(`${usdAmount} USD -> ${ethAmount} ETH`);

    const weiAmount = parseEther(ethAmount);
    const panQuoteBase = await this.quoteEthToPan(weiAmount);
    const panQuote = formatUnits(panQuoteBase, 18);
    console.log(`${ethAmount} ETH -> ${panQuote.toString()} PAN`);

    const panToEth = panQuoteBase.div(weiAmount);
    const panToUsd = panToEth.div(usdAmount / ethAmount);
    console.log(panQuoteBase, panToUsd.toString());


    const data = {
      donor: this.state.selectedAccount,
      panValue: panQuote.toString(),
      panAmountBase: panQuoteBase,
      ethValue: ethAmount,
      weiAmount,
      ethPriceUSD: ethPrice,
      pledgeTotalUSD: usdAmount,
      pledgeTierUSD: pledgeTier,
      pledgeDuration,
    };
    console.log('data:', data);

    // const multihash = await ipfsAdd(data);
    // console.log('multihash:', multihash);

    // const receipt = await donatePan(data, multihash);
    // console.log('receipt:', receipt);
    this.donatePan(data);
  }

  async donatePan(data, multihash) {
    return;
    const minTokens = data.panAmountBase.sub(5000);
    const block = await this.provider.getBlock();
    const deadline = BN(block.timestamp).add(5000);
    const tx = await this.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
      value: data.weiAmount,
      gasLimit: hexlify(6e6),
      gasPrice: hexlify(4e9),
    });
    console.log('tx:', tx);
    await tx.wait(1);
    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    console.log('receipt:', receipt);
    console.log();
    console.log('NEW QUOTE');
    const panQuoteBase = await this.quoteEthToPan(data.weiAmount);
    const panQuote = formatUnits(panQuoteBase, 18);
    console.log(`${data.ethValue} ETH -> ${panQuote.toString()} PAN`);
    return;
    const allowed = await checkAllowance(
      this.token,
      this.state.selectedAccount,
      this.tokenCapacitor.address,
      data.panAmount
    );
    if (allowed) {
      console.log('tokenCapacitor:', this.tokenCapacitor);
      return this.tokenCapacitor.functions.donate(
        data.donor,
        data.panAmount,
        Buffer.from(multihash),
        {
          gasLimit: '0x6AD790',
          // gasPrice: '0x77359400',
        }
      );
    } else {
      await this.token.functions.approve(this.tokenCapacitor.address, data.panAmount);
      return this.donatePan(data);
    }
  }

  render() {
    return (
      <div>
        <button onClick={() => this.setState({ liked: true })}>FDSAFDSAFDSASD</button>
        <Donate handleClick={this.handleDonate} />
      </div>
    );
  }
}

ReactDOM.render(<LikeButton />, document.querySelector('#root_container'));
