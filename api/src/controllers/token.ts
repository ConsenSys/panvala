import * as ethers from 'ethers';
import { circulatingSupply as _circulatingSupply } from '../utils/token';

const { formatUnits } = ethers.utils;

export async function circulatingSupply(req, res) {
  return _circulatingSupply()
    .then(supply => formatUnits(supply, '18'))
    .then(value => res.send(value))
    .catch(error => {
      console.error(error);
      const msg = `Error getting circulating supply: ${error.message}`;
      return res.status(500).send(msg);
    });
}
