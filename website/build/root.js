'use strict';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var provider, ipfs, Buffer, token, tokenCapacitor, exchange;
var {
  utils: {
    parseEther,
    formatEther,
    parseUnits,
    formatUnits,
    bigNumberify,
    hexlify
  }
} = ethers;

function BN(small) {
  return bigNumberify(small);
}

function checkAllowance(_x, _x2, _x3, _x4) {
  return _checkAllowance.apply(this, arguments);
}

function _checkAllowance() {
  _checkAllowance = _asyncToGenerator(function* (token, owner, spender, numTokens) {
    var allowance = yield token.functions.allowance(owner, spender);
    return allowance.gte(numTokens);
  });
  return _checkAllowance.apply(this, arguments);
}

function fetchEthPrice() {
  return _fetchEthPrice.apply(this, arguments);
}

function _fetchEthPrice() {
  _fetchEthPrice = _asyncToGenerator(function* () {
    var result = yield fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
    var json = yield result.json();
    var ethPrice = json.data.amount;
    return ethPrice;
  });
  return _fetchEthPrice.apply(this, arguments);
}

function quotePanToEth(panAmount, ethPrice) {
  console.log("1 ETH: ".concat(ethPrice, " PAN"));
  return parseInt(panAmount, 10) / parseInt(ethPrice, 10);
}

function quoteUsdToEth(usdAmount, ethPrice) {
  console.log("1 ETH: ".concat(ethPrice, " USD"));
  return parseInt(usdAmount, 10) / parseInt(ethPrice, 10);
}

function ipfsAdd(obj) {
  return new Promise((resolve, reject) => {
    var data = Buffer.from(JSON.stringify(obj));
    ipfs.add(data, (err, result) => {
      if (err) reject(new Error(err));
      var {
        hash
      } = result[0];
      resolve(hash);
    });
  });
}

var Donate = (_ref) => {
  var {
    handleClick
  } = _ref;
  return React.createElement("div", null, React.createElement("button", {
    onClick: handleClick,
    className: "f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
  }, "Donate Now"));
};

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAccount: '',
      error: false
    };
    this.handleDonate = this.handleDonate.bind(this);
  }

  componentDidMount() {
    var _this = this;

    return _asyncToGenerator(function* () {
      // helpers
      if (typeof window.IpfsHttpClient !== 'undefined') {
        var Ipfs = window.IpfsHttpClient;
        Buffer = Ipfs.Buffer;
        ipfs = new Ipfs({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https'
        });
      } else {
        _this.setState({
          error: 'Ipfs client did not setup correctly.'
        });
      } // setup ethereum


      yield _this.setSelectedAccount();
      yield _this.setContracts();
    })();
  }

  setSelectedAccount() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (typeof window.ethereum !== 'undefined') {
        if (!provider) {
          _this2.provider = new ethers.providers.Web3Provider(window.ethereum);
        }

        var selectedAccount = (yield _this2.provider.listAccounts())[0]; // user not enabled for this app

        if (!selectedAccount) {
          window.ethereum.enable().then(enabled => {
            selectedAccount = enabled[0];
          });
        }

        _this2.setState({
          selectedAccount
        });

        return selectedAccount;
      }
    })();
  }

  setContracts() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (typeof _this3.provider !== 'undefined') {
        var {
          chainId
        } = yield _this3.provider.getNetwork();

        var signer = _this3.provider.getSigner();

        var tokenAddress = chainId === 4 ? '0xa6208407aFA5B0995421fF608Dd84EAaA4c71AE4' : chainId === 1 && '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44';
        _this3.token = new ethers.Contract(tokenAddress, tokenAbi, signer);
        _this3.tokenCapacitor = new ethers.Contract('0xad6E0b491F48F5fACc492b9165c0A38121202756', tcAbi, signer);
        var exchangeAddress = chainId === 4 ? '0x103Bf69E174081321DE44cBA78F220F5d30931e8' : chainId === 1 && '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7';
        _this3.exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);

        _this3.queryExchange(_this3.exchange);
      } else {
        var account = yield _this3.setSelectedAccount();

        if (account) {
          yield _this3.setContracts();
        } else {
          _this3.setState({
            error: 'You must login to MetaMask.'
          });

          return;
        }
      }
    })();
  }

  queryExchange(exchange) {
    console.log('exchange:', exchange); // exchange.once('TokenPurchase', (buyer, eth_sold, tokens_bought) => {
    //   console.log('buyer:', buyer);
    //   console.log(`eth_sold: ${eth_sold}`);
    //   console.log(`tokens_bought: ${tokens_bought}`);
    // });
    // const ethSold = '1000000000000000000';
    // const p = await this.exchange.functions.getEthToTokenInputPrice(ethSold);
    // console.log('p.toString():', formatUnits(p.toString(), 18).toString());
  } // Sell order (exact input) -> calculates amount bought (output)


  quoteEthToPan(etherToSpend) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      // Sell ETH for PAN
      var inputAmount = etherToSpend; // ETH reserve

      var inputReserve = yield _this4.provider.getBalance(_this4.exchange.address);
      console.log("ETH reserve: ".concat(inputReserve.toString())); // PAN reserve

      var outputReserve = yield _this4.token.balanceOf(_this4.exchange.address);
      console.log("PAN reserve: ".concat(outputReserve.toString())); // Output amount bought

      var numerator = inputAmount.mul(outputReserve).mul(997);
      var denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
      var panToReceive = numerator.div(denominator);
      var rate = panToReceive.div(inputAmount);
      quotePanToEth(panToReceive, rate);
      return panToReceive;
    })();
  }

  handleDonate(e) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      e.preventDefault(); // make sure ethereum is hooked up properly

      if (!_this5.state.selectedAccount) {
        var account = yield _this5.setSelectedAccount();

        if (!account) {
          alert('You must be logged into MetaMask.');
          return;
        }
      }

      var pledgeTierSelect = document.getElementById('pledge-tier-select');
      var pledgeDurationSelect = document.getElementById('pledge-duration-select');

      if (pledgeTierSelect.value === '0') {
        alert('You must select a pledge tier.');
        return;
      }

      if (pledgeDurationSelect.value === '0') {
        alert('You must select a pledge duration.');
        return;
      }

      var pledgeTier = parseInt(pledgeTierSelect.value, 10);
      var pledgeDuration = parseInt(pledgeDurationSelect.value, 10);
      var usdAmount = pledgeTier * pledgeDuration;
      var ethPrice = yield fetchEthPrice();
      var ethAmount = quoteUsdToEth(usdAmount, ethPrice).toString();
      console.log("".concat(usdAmount, " USD -> ").concat(ethAmount, " ETH"));
      var weiAmount = parseEther(ethAmount);
      var panQuoteBase = yield _this5.quoteEthToPan(weiAmount);
      var panQuote = formatUnits(panQuoteBase, 18);
      console.log("".concat(ethAmount, " ETH -> ").concat(panQuote.toString(), " PAN"));
      var panToEth = panQuoteBase.div(weiAmount);
      var panToUsd = panToEth.div(usdAmount / ethAmount);
      console.log(panQuoteBase, panToUsd.toString());
      var data = {
        donor: _this5.state.selectedAccount,
        panValue: panQuote.toString(),
        panAmountBase: panQuoteBase,
        ethValue: ethAmount,
        weiAmount,
        ethPriceUSD: ethPrice,
        pledgeTotalUSD: usdAmount,
        pledgeTierUSD: pledgeTier,
        pledgeDuration
      };
      console.log('data:', data); // const multihash = await ipfsAdd(data);
      // console.log('multihash:', multihash);
      // const receipt = await donatePan(data, multihash);
      // console.log('receipt:', receipt);

      _this5.donatePan(data);
    })();
  }

  donatePan(data, multihash) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      return;
      var minTokens = data.panAmountBase.sub(5000);
      var block = yield _this6.provider.getBlock();
      var deadline = BN(block.timestamp).add(5000);
      var tx = yield _this6.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
        value: data.weiAmount,
        gasLimit: hexlify(6e6),
        gasPrice: hexlify(4e9)
      });
      console.log('tx:', tx);
      yield tx.wait(1);
      var receipt = yield _this6.provider.getTransactionReceipt(tx.hash);
      console.log('receipt:', receipt);
      console.log();
      console.log('NEW QUOTE');
      var panQuoteBase = yield _this6.quoteEthToPan(data.weiAmount);
      var panQuote = formatUnits(panQuoteBase, 18);
      console.log("".concat(data.ethValue, " ETH -> ").concat(panQuote.toString(), " PAN"));
      return;
      var allowed = yield checkAllowance(_this6.token, _this6.state.selectedAccount, _this6.tokenCapacitor.address, data.panAmount);

      if (allowed) {
        console.log('tokenCapacitor:', _this6.tokenCapacitor);
        return _this6.tokenCapacitor.functions.donate(data.donor, data.panAmount, Buffer.from(multihash), {
          gasLimit: '0x6AD790' // gasPrice: '0x77359400',

        });
      } else {
        yield _this6.token.functions.approve(_this6.tokenCapacitor.address, data.panAmount);
        return _this6.donatePan(data);
      }
    })();
  }

  render() {
    return React.createElement("div", null, React.createElement("button", {
      onClick: () => this.setState({
        liked: true
      })
    }, "FDSAFDSAFDSASD"), React.createElement(Donate, {
      handleClick: this.handleDonate
    }));
  }

}

ReactDOM.render(React.createElement(LikeButton, null), document.querySelector('#root_container'));