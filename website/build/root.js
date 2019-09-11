'use strict';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var Buffer, ipfs; // prettier-ignore

var {
  formatEther,
  parseEther,
  formatUnits,
  hexlify,
  getAddress
} = ethers.utils;

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAccount: '',
      step: null,
      error: false,
      message: '',
      tier: '',
      panPurchased: 0
    };
    this.handleClickDonate = this.handleClickDonate.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.token;
    this.tokenCapacitor;
    this.exchange;
    this.provider;
  } // Setup ipfs, call other setup functions


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
  } // Setup provider & selected account


  setSelectedAccount() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (typeof window.ethereum !== 'undefined') {
        if (!_this2.provider) {
          _this2.provider = new ethers.providers.Web3Provider(window.ethereum);
        }

        var selectedAccount = (yield _this2.provider.listAccounts())[0]; // user not enabled for this app

        if (!selectedAccount) {
          window.ethereum.enable().then(enabled => {
            selectedAccount = enabled[0];
          }).catch(error => {
            throw error;
          });
        }

        _this2.setState({
          selectedAccount
        });

        return selectedAccount;
      } else {
        alert('MetaMask not found. Please download MetaMask @ metamask.io');
      }
    })();
  } // Setup contracts


  setContracts() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (typeof _this3.provider !== 'undefined') {
        var {
          chainId
        } = yield _this3.provider.getNetwork();

        var signer = _this3.provider.getSigner(); // Addresses


        var tokenAddress = chainId === 4 ? '0x4912d6aBc68e4F02d1FdD6B79ed045C0A0BAf772' : chainId === 1 && '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44';
        var tcAddress = chainId === 4 ? '0xA062C59F42a45f228BEBB6e7234Ed1ea14398dE7' : chainId === 1 && '0x9a7B675619d3633304134155c6c976E9b4c1cfB3';
        var exchangeAddress = chainId === 4 ? '0x25EAd1E8e3a9C38321488BC5417c999E622e36ea' : chainId === 1 && '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7'; // Get codes

        var tokenCode = yield _this3.provider.getCode(tokenAddress);
        var tcCode = yield _this3.provider.getCode(tcAddress);
        var exchangeCode = yield _this3.provider.getCode(exchangeAddress); // prettier-ignore

        if (!tokenAddress || !tcAddress || !exchangeAddress || !tokenCode || !tcCode || !exchangeCode) {
          throw new Error('Invalid address or no code at address.');
        } // Init token, token capacitor, uniswap exchange contracts


        _this3.token = new ethers.Contract(tokenAddress, tokenAbi, signer);
        _this3.tokenCapacitor = new ethers.Contract(tcAddress, tcAbi, signer);
        _this3.exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);
      } else {
        // No provider yet
        var account = yield _this3.setSelectedAccount();

        if (account) {
          yield _this3.setContracts();
        } else {
          // Invalid provider / provider not enabled for this site
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
      console.log(''); // Sell ETH for PAN

      var ethAmount = utils.BN(etherToSpend); // ETH reserve

      var inputReserve = yield _this4.provider.getBalance(_this4.exchange.address);
      console.log("ETH reserve: ".concat(formatEther(inputReserve))); // PAN reserve

      var outputReserve = yield _this4.token.balanceOf(_this4.exchange.address);
      console.log("PAN reserve: ".concat(formatUnits(outputReserve, 18)));
      var numerator = ethAmount.mul(outputReserve).mul(997);
      var denominator = inputReserve.mul(1000).add(ethAmount.mul(997));
      var panToReceive = numerator.div(denominator);
      console.log("quote ".concat(formatEther(ethAmount), " ETH : ").concat(formatUnits(panToReceive.toString(), 18), " PAN")); // EQUIVALENT, DIRECT CHAIN CALL
      // PAN bought w/ input ETH
      // const panToReceive = await this.exchange.getEthToTokenInputPrice(ethAmount);
      // console.log(`${formatEther(ethAmount)} ETH -> ${formatUnits(panToReceive, 18)} PAN`);

      return panToReceive;
    })();
  } // Check that provider & contracts are setup correctly


  checkEthereum() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      var account;

      try {
        account = getAddress(_this5.state.selectedAccount);
      } catch (_unused) {
        account = yield _this5.setSelectedAccount();

        if (!account) {
          var errMsg = 'You must be logged into MetaMask.';

          _this5.setState({
            error: errMsg
          });

          alert(errMsg);
          throw new Error(errMsg);
        }
      }

      if (typeof _this5.token === 'undefined') {
        yield _this5.setContracts();

        if (typeof _this5.token === 'undefined') {
          var _errMsg = 'Contracts not set correctly.';

          _this5.setState({
            error: _errMsg
          });

          alert(_errMsg);
          throw new Error(_errMsg);
        }
      }
    })();
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
  } // Click handler for donations


  handleClickDonate(e) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      e.preventDefault(); // make sure ethereum is hooked up properly

      try {
        yield _this6.checkEthereum();
      } catch (error) {
        console.error(error);
        throw error;
      }

      _this6.setState({
        step: 1,
        message: 'Adding metadata to IPFS...'
      });

      var pledgeMonthlySelect = document.getElementById('pledge-tier-select');
      var pledgeTermSelect = document.getElementById('pledge-duration-select');

      if (pledgeMonthlySelect.value === '0') {
        alert('You must select a pledge tier.');
        return;
      }

      if (pledgeTermSelect.value === '0') {
        alert('You must select a pledge duration.');
        return;
      }

      var tier = _this6.setTier(pledgeMonthlySelect.value);

      _this6.setState({
        tier
      }); // Calculate pledge total value (monthly * term)


      var pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
      var pledgeTerm = parseInt(pledgeTermSelect.value, 10);
      var pledgeTotal = utils.BN(pledgeMonthlyUSD).mul(pledgeTerm); // Get USD price of 1 ETH

      var ethPrice = yield utils.fetchEthPrice(); // Convert USD to ETH, print

      var ethAmount = utils.quoteUsdToEth(pledgeTotal, ethPrice).toString();
      console.log("".concat(pledgeTotal, " USD -> ").concat(ethAmount, " ETH")); // Convert to wei, print

      var weiAmount = parseEther(ethAmount);
      var panValue = yield _this6.quoteEthToPan(weiAmount); // PAN bought w/ 1 ETH

      yield _this6.quoteEthToPan(parseEther('1')); // Build donation object

      var donation = {
        version: '1',
        memo: '',
        usdValue: utils.BN(pledgeTotal).toString(),
        ethValue: weiAmount.toString(),
        pledgeMonthlyUSD,
        pledgeTerm
      };
      console.log('donation:', donation);

      try {
        // Add to ipfs
        var multihash = yield utils.ipfsAdd(donation);
        console.log('multihash:', multihash); // Purchase Panvala pan

        yield _this6.purchasePan(donation, panValue); // Donate Panvala pan

        yield _this6.donatePan(multihash);
      } catch (error) {
        console.error("ERROR: ".concat(error.message));
        return _this6.setState({
          message: error.message,
          error: error.message
        });
      }
    })();
  }

  fetchAutopilot() {
    return _asyncToGenerator(function* () {
      var list_id = '';
      var email = 'email@email.com';
      var endpoint = "https://api2.autopilothq.com/v1/list/".concat(list_id, "/contact/").concat(email); // const endpoint = `https://api2.autopilothq.com/v1/lists`;

      var postData = {
        memo: 'TEST POST',
        usdValue: '1 MILLION DOLLARS',
        ethValue: '1 TRILLION DOLLARS',
        pledgeMonthlyUSD: 50,
        pledgeTerm: 9000
      };
      var data = yield fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          autopilotapikey: ''
        }
      });
      var json = yield data.json();
      console.log('json:', json); // const completedList = json.lists.find(l => l.title === 'completed-donation-flow');
      // console.log("completedList:", completedList);
    })();
  } // Sell ETH, buy PAN


  purchasePan(donation, panValue) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      // TODO: subtract a percentage
      var minTokens = utils.BN(panValue).sub(5000);
      var block = yield _this7.provider.getBlock();
      var deadline = utils.BN(block.timestamp).add(3600); // add one hour
      // Buy Pan with Eth

      try {
        _this7.setState({
          message: 'Purchasing PAN from Uniswap...'
        });

        var tx = yield _this7.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
          value: hexlify(utils.BN(donation.ethValue)),
          gasLimit: hexlify(1e6),
          gasPrice: hexlify(5e9)
        });
        console.log('tx:', tx);

        _this7.setState({
          message: 'Waiting for transaction confirmation...'
        }); // Wait for tx to get mined


        yield _this7.provider.waitForTransaction(tx.hash); // TODO: maybe wait for blocks

        var receipt = yield _this7.provider.getTransactionReceipt(tx.hash);
        console.log('receipt:', receipt);
        console.log(); // Get new quote

        console.log('NEW QUOTE');
        yield _this7.quoteEthToPan(donation.ethValue);
        yield _this7.quoteEthToPan(parseEther('1')); // Progress to step 2

        return _this7.setState({
          panPurchased: panValue,
          step: 2,
          message: 'Checking allowance...'
        });
      } catch (error) {
        console.error("ERROR: ".concat(error.message));
      }
    })();
  } // Donate PAN -> token capacitor
  // Approve if necessary


  donatePan(multihash) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      // Exit if user did not complete ETH -> PAN swap
      if (!_this8.state.panPurchased) {
        return _this8.setState({
          step: null,
          message: ''
        });
      } // Check allowance


      var allowed = yield utils.checkAllowance(_this8.token, _this8.state.selectedAccount, _this8.tokenCapacitor.address, _this8.state.panPurchased);

      if (allowed) {
        _this8.setState({
          message: 'Donating PAN...'
        }); // Donate PAN to token capacitor


        var donateTx = yield _this8.tokenCapacitor.functions.donate(_this8.state.selectedAccount, _this8.state.panPurchased, Buffer.from(multihash), {
          gasLimit: hexlify(1e6),
          // 1 MM
          gasPrice: hexlify(5e9) // 5 GWei

        }); // Wait for tx to be mined

        yield _this8.provider.waitForTransaction(donateTx.hash);
        return _this8.setState({
          step: 3,
          message: _this8.state.tier
        });
      } else {
        _this8.setState({
          message: 'Approving tokens...'
        }); // Approve token capacitor


        yield _this8.token.functions.approve(_this8.tokenCapacitor.address, ethers.constants.MaxUint256); // Call donate again

        return _this8.donatePan(multihash, _this8.state.panPurchased);
      }
    })();
  }

  handleCancel() {
    this.setState({
      step: null,
      message: ''
    });
  }

  render() {
    return React.createElement(React.Fragment, null, React.createElement(DonateButton, {
      handleClick: this.handleClickDonate
    }), React.createElement(WebsiteModal, {
      isOpen: true,
      step: this.state.step,
      message: this.state.message,
      handleCancel: this.handleCancel
    }));
  }

}

ReactDOM.render(React.createElement(Root, null), document.querySelector('#root_container'));