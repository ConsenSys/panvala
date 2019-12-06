import * as ethers from 'ethers';
import { circulatingSupply as _circulatingSupply, projectedAvailableTokens } from '../utils/token';
import { getContracts } from '../utils/eth';
import { getWinningSlate } from '../utils/slates';

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

export async function getBudget(req, res) {
  try {
    const { gatekeeper, tokenCapacitor } = await getContracts();
    const currentEpoch = await gatekeeper.currentEpochNumber();
    const winningSlate = await getWinningSlate();

    const epochTokens = await projectedAvailableTokens(
      tokenCapacitor,
      gatekeeper,
      currentEpoch,
      winningSlate
    );

    res.json({
      epochNumber: currentEpoch,
      epochBudget: epochTokens.toString(),
    });
  } catch (error) {
    res.send(error);
  }
}
