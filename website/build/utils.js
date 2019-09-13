'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var {
  bigNumberify,
  parseUnits
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

  getEndpointAndHeaders() {
    var urlRoute = window.location.href;
    var endpoint = urlRoute.includes('staging/donate') ? 'https://staging-api.panvala.com' : urlRoute.includes('localhost') ? 'http://localhost:5001' : 'https://api.panvala.com';
    var corsHeaders = {
      'Access-Control-Allow-Origin': endpoint,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type'
    };

    var headers = _objectSpread({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, corsHeaders);

    return {
      endpoint,
      headers
    };
  },

  getTier(monthUSD) {
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
  },

  getGasPrice() {
    var _arguments = arguments;
    return _asyncToGenerator(function* () {
      var speed = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : 'fast';
      var res = yield fetch('https://ethgasstation.info/json/ethgasAPI.json');
      var gasPrices = yield res.json();
      console.log('gasPrices:', gasPrices);
      var gasPrice;

      if (gasPrices && gasPrices.hasOwnProperty(speed)) {
        gasPrice = parseUnits((gasPrices[speed] / 10).toString(), 'gwei');
      } else if (gasPrices && gasPrices.hasOwnProperty('fast')) {
        gasPrice = parseUnits((gasPrices.fast / 10).toString(), 'gwei');
      } else {
        gasPrice = parseUnits('12', 'gwei');
      }

      return gasPrice.toHexString();
    })();
  },

  postAutopilot(email, firstName, lastName, txData) {
    return _asyncToGenerator(function* () {
      var postData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        txHash: txData.txHash,
        memo: txData.memo,
        usdValue: txData.usdValue,
        ethValue: txData.ethValue,
        pledgeMonthlyUSD: txData.pledgeMonthlyUSD,
        pledgeTerm: txData.pledgeTerm,
        multihash: txData.multihash
      };
      var {
        endpoint,
        headers
      } = utils.getEndpointAndHeaders();
      var url = "".concat(endpoint, "/api/website");
      var res = yield fetch(url, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers
      });
      var json = yield res.json();
      console.log('contact:', json);
      return true;
    })();
  }

};