import * as ethers from 'ethers';
import { parseEther, bigNumberify } from 'ethers/utils';
import {
  circulatingSupply as _circulatingSupply,
  projectedAvailableTokens,
  getEthPrice,
} from '../utils/token';
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
    const { gatekeeper, tokenCapacitor, exchange } = await getContracts();
    const currentEpoch = await gatekeeper.currentEpochNumber();
    const winningSlate = await getWinningSlate();

    const epochTokensBase = await projectedAvailableTokens(
      tokenCapacitor,
      gatekeeper,
      currentEpoch,
      winningSlate
    );

    // 1 ETH : 10861515630668542666008 attoPAN
    const panPriceWei = await exchange.getEthToTokenInputPrice(parseEther('1'));
    const panPriceETH = formatUnits(panPriceWei, 18);

    // 1 ETH : 140.325 USD
    const ethPriceUSD = await getEthPrice();

    // 2,000,000 PAN : ??? USD
    const epochBudgetUSD = epochTokensBase
      .div(panPriceWei)
      .mul(bigNumberify(parseInt(ethPriceUSD)))
      .toString();

    res.json({
      epochNumber: currentEpoch.toNumber(),
      epochBudgetPAN: formatUnits(epochTokensBase, 18),
      epochBudgetUSD,
      ethPriceUSD,
      panPriceETH,
    });
  } catch (error) {
    res.status(400).send({
      msg: 'Error getting budget',
      errors: [error],
    });
  }
}
