'use strict';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var {
  bigNumberify
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
      var options = {
        timeout: 60000,
        pin: true
      };
      ipfs.add(data, options, (err, result) => {
        if (err || !result) {
          return reject(new Error(err));
        }

        var {
          hash
        } = result[0];
        resolve(hash);
      });
    });
  }

};