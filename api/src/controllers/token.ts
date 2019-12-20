import * as ethers from 'ethers';
import { parseEther, bigNumberify, BigNumber } from 'ethers/utils';
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
    const { gatekeeper, tokenCapacitor, exchange, network } = await getContracts();

    // Exit early if there's no exchange (happens on local rpc)
    if (!exchange) {
      throw new Error(
        `Uniswap exchange contract is undefined. You must be on rinkeby or mainnet. Current network: ${
          network.chainId
        }`
      );
    }

    const currentEpoch = await gatekeeper.currentEpochNumber();
    let winningSlate: number | undefined;
    try {
      winningSlate = await getWinningSlate();
    } catch (error) {
      // ignore / just log errors. winningSlate can be left undefined
      console.log('getWinningSlate error:', error);
    }

    let epochTokensBase, annualTokensBase: BigNumber | undefined;
    try {
      [epochTokensBase, annualTokensBase] = await Promise.all([
        projectedAvailableTokens(tokenCapacitor, gatekeeper, currentEpoch, winningSlate),
        projectedAvailableTokens(tokenCapacitor, gatekeeper, currentEpoch.add(4), winningSlate),
      ]);
    } catch (error) {
      return res.status(409).json({
        msg: 'Problem calculating available tokens',
        errors: [error],
      });
    }

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

    const annualBudgetUSD = annualTokensBase
      .div(panPriceWei)
      .mul(bigNumberify(parseInt(ethPriceUSD)))
      .toString();

    res.json({
      epochNumber: currentEpoch.toNumber(),
      epochBudgetPAN: formatUnits(epochTokensBase, 18),
      annualBudgetPAN: formatUnits(annualTokensBase, 18),
      epochBudgetUSD,
      annualBudgetUSD,
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
