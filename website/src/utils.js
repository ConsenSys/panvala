'use strict';

const { bigNumberify } = ethers.utils;

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

      const options = { timeout: 60000, pin: true };

      ipfs.add(data, options, (err, result) => {
        if (err || !result) {
          return reject(new Error(err));
        }
        const { hash } = result[0];
        resolve(hash);
      });
    });
  },
};
