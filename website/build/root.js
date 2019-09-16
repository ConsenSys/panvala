'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var Buffer; // prettier-ignore

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
      email: '',
      fullName: '',
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
  } // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------


  componentDidMount() {
    var _this = this;

    return _asyncToGenerator(function* () {
      // TODO: use a different lib (maybe ethers)
      if (typeof window.IpfsHttpClient !== 'undefined') {
        Buffer = window.IpfsHttpClient.Buffer;
      } else {
        _this.setState({
          error: 'Buffer did not setup correctly.'
        });
      } // Listen for network changes -> reload page


      window.ethereum.once('networkChanged', network => {
        console.log('MetaMask network changed:', network);
        window.location.reload();
      });
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
            if (error.stack.includes('User denied account authorization')) {
              alert('MetaMask not enabled. In order to donate pan, you must authorize this app.');
            }
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
  } // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  // Reset step / close modal


  handleCancel() {
    this.setState({
      step: null,
      message: ''
    });
  } // Check that provider & contracts are setup correctly


  checkEthereum() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var account;

      try {
        account = getAddress(_this4.state.selectedAccount);
      } catch (_unused) {
        account = yield _this4.setSelectedAccount();

        if (!account) {
          var errMsg = 'You must be logged into MetaMask.';

          _this4.setState({
            error: errMsg
          });

          alert(errMsg);
          throw new Error(errMsg);
        }
      }

      if (typeof _this4.token === 'undefined') {
        yield _this4.setContracts();

        if (typeof _this4.token === 'undefined') {
          var _errMsg = 'Contracts not set correctly.';

          _this4.setState({
            error: _errMsg
          });

          alert(_errMsg);
          throw new Error(_errMsg);
        }
      }
    })();
  }

  checkNetwork() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      if (!_this5.state.selectedAccount || !_this5.exchange || !_this5.provider || !_this5.token || !_this5.tokenCapacitor) {
        throw new Error('Ethereum not setup properly.');
      }

      var correctChainId = window.location.href.includes('panvala.com/donate') ? 1 : 4;
      var network = yield _this5.provider.getNetwork();

      if (network.chainId !== correctChainId) {
        alert('Wrong network or route'); // prevent further action

        throw new Error('Wrong network or route');
      }
    })();
  } // Sell order (exact input) -> calculates amount bought (output)


  quoteEthToPan(etherToSpend) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      console.log(''); // Sell ETH for PAN

      var ethAmount = utils.BN(etherToSpend); // ETH reserve

      var inputReserve = yield _this6.provider.getBalance(_this6.exchange.address);
      console.log("ETH reserve: ".concat(formatEther(inputReserve))); // PAN reserve

      var outputReserve = yield _this6.token.balanceOf(_this6.exchange.address);
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
  } // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------
  // Click handler for donations


  handleClickDonate(e) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      e.preventDefault();
      var pledgeFirstName = document.getElementById('pledge-first-name');
      var pledgeLastName = document.getElementById('pledge-last-name');
      var pledgeEmail = document.getElementById('pledge-email');
      var pledgeMonthlySelect = document.getElementById('pledge-tier-select');
      var pledgeTermSelect = document.getElementById('pledge-duration-select');

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

      yield _this7.setSelectedAccount();
      yield _this7.setContracts(); // Make sure ethereum is hooked up properly

      try {
        yield _this7.checkEthereum();
      } catch (error) {
        console.error(error);
        throw error;
      } // Make sure the user is connected to the correct network (based on the URL)


      yield _this7.checkNetwork();
      var tier = utils.getTier(pledgeMonthlySelect.value);

      _this7.setState({
        tier,
        email: pledgeEmail.value,
        firstName: pledgeFirstName.value,
        lastName: pledgeLastName.value,
        step: 1,
        message: 'Adding metadata to IPFS...'
      }); // Calculate pledge total value (monthly * term)


      var pledgeMonthlyUSD = parseInt(pledgeMonthlySelect.value, 10);
      var pledgeTerm = parseInt(pledgeTermSelect.value, 10);
      var pledgeTotal = utils.BN(pledgeMonthlyUSD).mul(pledgeTerm); // Get USD price of 1 ETH

      var ethPrice = yield utils.fetchEthPrice(); // Convert USD to ETH, print

      var ethAmount = utils.quoteUsdToEth(pledgeTotal, ethPrice).toString();
      console.log("".concat(pledgeTotal, " USD -> ").concat(ethAmount, " ETH")); // Convert to wei, print

      var weiAmount = parseEther(ethAmount);
      var panValue = yield _this7.quoteEthToPan(weiAmount); // PAN bought w/ 1 ETH

      yield _this7.quoteEthToPan(parseEther('1')); // Build donation object

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
        var {
          endpoint,
          headers
        } = utils.getEndpointAndHeaders();
        var url = "".concat(endpoint, "/api/ipfs");
        var data = yield fetch(url, {
          method: 'POST',
          body: JSON.stringify(donation),
          headers
        });
        var multihash = yield data.json();
        console.log('multihash:', multihash); // Purchase Panvala pan

        var panPurchased = yield _this7.purchasePan(donation, panValue);

        if (panPurchased && _this7.state.step != null) {
          // Progress to step 2
          yield _this7.setState({
            panPurchased,
            step: 2,
            message: 'Checking allowance...'
          }); // Donate Panvala pan

          var txHash = yield _this7.donatePan(multihash);

          if (txHash) {
            var txData = _objectSpread({}, donation, {
              txHash,
              multihash
            });

            yield utils.postAutopilot(_this7.state.email, _this7.state.firstName, _this7.state.lastName, txData);
            pledgeFirstName.value = '';
            pledgeLastName.value = '';
            pledgeEmail.value = '';
            pledgeMonthlySelect.value = '0';
            pledgeTermSelect.value = '0';
          }
        }
      } catch (error) {
        console.error("ERROR: ".concat(error.message));
        return _this7.setState({
          step: null,
          message: error.message,
          error: error.message
        });
      }
    })();
  } // Sell ETH -> uniswap exchange (buy PAN)


  purchasePan(donation, panValue) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      // TODO: subtract a percentage
      var minTokens = utils.BN(panValue).sub(5000);
      var block = yield _this8.provider.getBlock();
      var deadline = utils.BN(block.timestamp).add(3600); // add one hour
      // Buy Pan with Eth

      try {
        _this8.setState({
          message: 'Purchasing PAN from Uniswap...'
        });

        var gasPrice = yield utils.getGasPrice();
        var tx = yield _this8.exchange.functions.ethToTokenSwapInput(minTokens, deadline, {
          value: hexlify(utils.BN(donation.ethValue)),
          gasLimit: hexlify(150000),
          gasPrice: gasPrice || hexlify(12e9)
        });
        console.log('tx:', tx);

        _this8.setState({
          message: 'Waiting for transaction confirmation...'
        }); // Wait for tx to get mined


        yield _this8.provider.waitForTransaction(tx.hash); // TODO: maybe wait for blocks

        var receipt = yield _this8.provider.getTransactionReceipt(tx.hash);
        console.log('receipt:', receipt);
        console.log(); // Get new quote

        console.log('NEW QUOTE');
        yield _this8.quoteEthToPan(donation.ethValue);
        yield _this8.quoteEthToPan(parseEther('1'));
        return panValue;
      } catch (error) {
        console.error("ERROR: ".concat(error.message));
        alert("Uniswap transaction failed: ".concat(error.message));
        yield _this8.setState({
          step: null,
          message: ''
        });
        return false;
      }
    })();
  } // Donate PAN -> Token Capacitor
  // Approve if necessary


  donatePan(multihash) {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      // Exit if user did not complete ETH -> PAN swap
      if (!_this9.state.panPurchased) {
        return _this9.setState({
          step: null,
          message: ''
        });
      } // Check allowance


      var allowed = yield utils.checkAllowance(_this9.token, _this9.state.selectedAccount, _this9.tokenCapacitor.address, _this9.state.panPurchased);

      if (allowed) {
        _this9.setState({
          message: 'Donating PAN...'
        });

        var gasPrice = yield utils.getGasPrice();

        try {
          // Donate PAN to token capacitor
          var donateTx = yield _this9.tokenCapacitor.functions.donate(_this9.state.selectedAccount, _this9.state.panPurchased, Buffer.from(multihash), {
            gasLimit: hexlify(150000),
            // 150K
            gasPrice: gasPrice || hexlify(12e9) // 12 GWei

          }); // Wait for tx to be mined

          yield _this9.provider.waitForTransaction(donateTx.hash);

          _this9.setState({
            step: 3,
            message: _this9.state.tier
          });

          return donateTx.hash;
        } catch (error) {
          console.error("ERROR: ".concat(error.message));
          alert("Donate transaction failed: ".concat(error.message));
          yield _this9.setState({
            step: null,
            message: ''
          });
          return false;
        }
      } else {
        _this9.setState({
          message: 'Approving tokens...'
        }); // Approve token capacitor


        yield _this9.token.functions.approve(_this9.tokenCapacitor.address, ethers.constants.MaxUint256); // Call donate again

        return _this9.donatePan(multihash, _this9.state.panPurchased);
      }
    })();
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