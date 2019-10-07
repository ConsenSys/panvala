const ethers = require('ethers');
const { formatUnits } = ethers.utils;

const { circulatingSupply } = require('../utils/token');

async function circulating(req, res) {
  return circulatingSupply()
    .then(supply => formatUnits(supply, '18'))
    .then(value => res.send(value))
    .catch(error => {
      console.error(error);
      const msg = `Error getting circulating supply: ${error.message}`;
      return res.status(500).send(msg);
    });
}

module.exports = {
  circulatingSupply: circulating,
};
