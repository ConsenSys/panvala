'use strict';

const { bigNumberify, parseUnits } = ethers.utils;

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
  getEndpointAndHeaders() {
    const urlRoute = window.location.href;
    const endpoint = urlRoute.includes('staging/donate')
      ? 'https://staging-api.panvala.com'
      : urlRoute.includes('localhost')
      ? 'http://localhost:5001'
      : 'https://api.panvala.com';

    const corsHeaders = {
      'Access-Control-Allow-Origin': endpoint,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type',
    };
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...corsHeaders,
    };
    return { endpoint, headers };
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
  async getGasPrice(speed = 'fast') {
    const res = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
    const gasPrices = await res.json();
    console.log('gasPrices:', gasPrices);
    let gasPrice;
    if (gasPrices && gasPrices.hasOwnProperty(speed)) {
      gasPrice = parseUnits((gasPrices[speed] / 10).toString(), 'gwei');
    } else if (gasPrices && gasPrices.hasOwnProperty('fast')) {
      gasPrice = parseUnits((gasPrices.fast / 10).toString(), 'gwei');
    } else {
      gasPrice = parseUnits('12', 'gwei');
    }
    return gasPrice.toHexString();
  },
  async postAutopilot(email, firstName, lastName, txData) {
    const postData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      txHash: txData.txHash,
      memo: txData.memo,
      usdValue: txData.usdValue,
      ethValue: txData.ethValue,
      pledgeMonthlyUSD: txData.pledgeMonthlyUSD,
      pledgeTerm: txData.pledgeTerm,
      multihash: txData.multihash,
    };
    const { endpoint, headers } = utils.getEndpointAndHeaders();
    const url = `${endpoint}/api/website`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(postData),
      headers,
    });
    const json = await res.json();
    console.log('contact:', json);
    return true;
  },
};
