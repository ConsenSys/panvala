'use strict';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var provider, Buffer, ipfs;
var {
  bigNumberify,
  parseUnits,
  formatEther,
  parseEther,
  formatUnits,
  hexlify
} = ethers.utils;
var utils = {
  BN(small) {
    return bigNumberify(small);
  },

  checkAllowance(token, owner, spender, numTokens) {
    return _asyncToGenerator(function* () {
      var allowance = yield token.functions.allowance(owner, spender);
      return allowance.gte(numTokens);
    })();
  },

  fetchEthPrice() {
    return _asyncToGenerator(function* () {
      var result = yield fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
      var json = yield result.json();
      var ethPrice = json.data.amount;
      return ethPrice;
    })();
  },

  quoteUsdToEth(pledgeTotalUSD, ethPrice) {
    console.log("1 ETH: ".concat(ethPrice, " USD"));
    return parseInt(pledgeTotalUSD, 10) / parseInt(ethPrice, 10);
  },

  ipfsAdd(obj) {
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

};

function DonateButton(_ref) {
  var {
    handleClick
  } = _ref;
  return React.createElement("div", null, React.createElement("button", {
    onClick: handleClick,
    className: "f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
  }, "Donate Now"));
}

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAccount: '',
      error: false
    };
    this.handleClickDonate = this.handleClickDonate.bind(this);
    this.token;
    this.tokenCapacitor;
    this.exchange;
    this.provider;
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
  } // Sell order (exact input) -> calculates amount bought (output)


  quoteEthToPan(etherToSpend) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      // Sell ETH for PAN
      var inputAmount = utils.BN(etherToSpend); // ETH reserve

      var inputReserve = yield _this4.provider.getBalance(_this4.exchange.address);
      console.log("ETH reserve: ".concat(formatEther(inputReserve))); // PAN reserve

      var outputReserve = yield _this4.token.balanceOf(_this4.exchange.address);
      console.log("PAN reserve: ".concat(formatUnits(outputReserve, 18)));
      var numerator = inputAmount.mul(outputReserve).mul(997);
      var denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
      var panToReceive = numerator.div(denominator);
      console.log("quote ".concat(formatEther(inputAmount), " ETH : ").concat(formatUnits(panToReceive.toString(), 18), " PAN"));
      console.log('');
      return panToReceive;
    })();
  } // Steps:
  // Get element values
  // Calculate total donation
  // Fetch ETH price
  // Calculate ETH value based on total donation
  // Convert to Wei
  // Calculate PAN value base on Wei
  // Build donation object (should this go after purchasing pan?)
  // Add to ipfs
  // Purchase PAN
  // Donate PAN


  handleClickDonate(e) {
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

      var pledgeMonthlySelect = document.getElementById('pledge-tier-select');
      var pledgeTermSelect = document.getElementById('pledge-duration-select');

      if (pledgeMonthlySelect.value === '0') {
        alert('You must select a pledge tier.');
        return;
      }

      if (pledgeTermSelect.value === '0') {
        alert('You must select a pledge duration.');
        return;
      } // Calculate pledge total value (monthly * term)


      var pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
      var pledgeTerm = parseInt(pledgeTermSelect.value, 10);
      var pledgeTotal = utils.BN(pledgeMonthlyUSD).mul(pledgeTerm); // Get USD price of 1 ETH

      var ethPrice = yield utils.fetchEthPrice(); // Convert USD to ETH, print

      var ethAmount = utils.quoteUsdToEth(pledgeTotal, ethPrice).toString();
      console.log("".concat(pledgeTotal, " USD -> ").concat(ethAmount, " ETH")); // Convert to wei, print

      var weiAmount = parseEther(ethAmount);
      var panValue = yield _this5.quoteEthToPan(weiAmount); // PAN bought w/ 1 ETH

      yield _this5.quoteEthToPan(parseEther('1')); // // PAN bought w/ input ETH
      // const panToReceive = await this.exchange.getEthToTokenInputPrice(inputAmount);
      // console.log(`${formatEther(inputAmount)} ETH -> ${formatUnits(panToReceive, 18)} PAN`);
      // Build donation object

      var donation = {
        version: '1',
        memo: '',
        usdValue: utils.BN(pledgeTotal).toString(),
        ethValue: weiAmount,
        pledgeMonthlyUSD,
        pledgeTerm
      };
      console.log('donation:', donation); // Add to ipfs
      // const multihash = await utils.ipfsAdd(donation);
      // console.log('multihash:', multihash);
      // Purchase Panvala pan

      yield _this5.purchasePan(donation, panValue); // Donate Panvala pan
      // await this.donatePan(donation);
    })();
  }

  purchasePan(donation, panValue) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      var minTokens = utils.BN(panValue).sub(5000);
      var block = yield _this6.provider.getBlock();
      var deadline = utils.BN(block.timestamp).add(5000);
      var tx = yield _this6.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
        value: hexlify(donation.ethValue),
        gasLimit: hexlify(1e6),
        gasPrice: hexlify(5e9)
      });
      console.log('tx:', tx);
      var receipt = yield _this6.provider.getTransactionReceipt(tx.hash);
      console.log('receipt:', receipt);
      console.log(); // Get new quote

      console.log('NEW QUOTE');
      yield _this6.quoteEthToPan(donation.ethValue);
      yield _this6.quoteEthToPan(parseEther('1'));
    })();
  }

  donatePan(donation, multihash) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      var allowed = yield utils.checkAllowance(_this7.token, _this7.state.selectedAccount, _this7.tokenCapacitor.address, donation.panValue);

      if (allowed) {
        console.log('tokenCapacitor:', _this7.tokenCapacitor);
        return _this7.tokenCapacitor.functions.donate(donation.donor, donation.panValue, Buffer.from(multihash), {
          gasLimit: hexlify(1e6),
          // 1 MM
          gasPrice: hexlify(5e9) // 5 GWei

        });
      } else {
        yield _this7.token.functions.approve(_this7.tokenCapacitor.address, ethers.constants.MaxUint256);
        return _this7.donatePan(donation);
      }
    })();
  }

  render() {
    return React.createElement("div", null, React.createElement(DonateButton, {
      handleClick: this.handleClickDonate
    }));
  }

}

ReactDOM.render(React.createElement(Root, null), document.querySelector('#root_container'));