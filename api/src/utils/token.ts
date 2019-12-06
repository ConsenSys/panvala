import * as ethers from 'ethers';
import axios from 'axios';
import { getContracts, contractABIs } from './eth';
import { timing } from '.';
import { bigNumberify, BigNumberish } from 'ethers/utils';
import { IGatekeeper, ITokenCapacitor } from '../types';

const { bigNumberify: BN, parseUnits } = ethers.utils;
const { BasicToken: Token } = contractABIs;

const zero = BN(0);
export const asTokens = amount => parseUnits(amount, '18');

export function linearDecay(total, start, end, x) {
  const _end = BN(end);
  const _x = BN(x);
  const num = BN(total).mul(_end.sub(_x));
  const den = _end.sub(BN(start));
  return num.div(den);
}

export async function getEthPrice() {
  const result = await axios('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
  console.log('data:', result.data);
  const ethPrice = result.data.data.amount;
  return ethPrice;
}

export function calculateCirculatingSupply(params) {
  const {
    totalSupply,
    now,
    vestingStart,
    vestingEnd,
    initialUnvestedTokens,
    launchPartnerFundBalance,
    tokenCapacitorLockedBalance,
  } = params;

  const unvestedTokens =
    now < vestingStart
      ? initialUnvestedTokens
      : now > vestingEnd
      ? zero
      : linearDecay(initialUnvestedTokens, vestingStart, vestingEnd, now);

  const totalLocked = launchPartnerFundBalance.add(tokenCapacitorLockedBalance).add(unvestedTokens);
  return totalSupply.sub(totalLocked);
}

// Return the current circulating supply of PAN
export async function circulatingSupply() {
  // contracts
  const { tokenCapacitor, provider } = await getContracts();
  const tokenAddress = await tokenCapacitor.token();
  const token = new ethers.Contract(tokenAddress, Token.abi, provider);
  const launchPartnerFundAddress = '0x171dcDE3AC66a6DbED0FaC5e1d53132145520302';

  // vesting -- all vesting happens at the same rate, so we can treat all the vesting
  // contracts as a single one with the balance of all of them
  const vestingStart = 1572627600; // 2019-11-01T17:00:00.000Z
  const vestingDurationDays = 730;
  const vestingEnd = vestingStart + vestingDurationDays * timing.durations.ONE_DAY;
  const initialUnvestedTokens = asTokens('27406303');

  // balances
  const totalSupply = await token.totalSupply();
  const launchPartnerFundBalance = await token.balanceOf(launchPartnerFundAddress);
  const tokenCapacitorLockedBalance = await tokenCapacitor.lastLockedBalance();

  const now = Math.floor(new Date().getTime() / 1000);

  return calculateCirculatingSupply({
    now,
    vestingStart,
    vestingEnd,
    initialUnvestedTokens,
    launchPartnerFundBalance,
    tokenCapacitorLockedBalance,
    totalSupply,
  });
}

export async function projectedAvailableTokens(
  tokenCapacitor: ITokenCapacitor,
  gatekeeper: IGatekeeper,
  epochNumber: BigNumberish,
  winningSlate?: any
) {
  // project the unlocked token balance at the start of the next epoch
  let pUnlockedBalance = bigNumberify('0');
  if (tokenCapacitor.functions.hasOwnProperty('projectedUnlockedBalance')) {
    const nextEpochStart = await gatekeeper.functions.epochStart(bigNumberify(epochNumber).add(1));
    pUnlockedBalance = await tokenCapacitor.functions.projectedUnlockedBalance(nextEpochStart);
  }
  // console.log('projected unlocked balance:', pUnlockedBalance);

  let unredeemedTokens = '0';
  if (winningSlate && winningSlate.proposals.length) {
    // filter out all the proposals that have been withdrawn already
    const unredeemedGrantsPromises = winningSlate.proposals.map(async (p: any) => {
      const proposal = await tokenCapacitor.functions.proposals(p.proposalID);
      return {
        ...p,
        withdrawn: proposal.withdrawn,
      };
    });
    const unredeemedGrants: any[] = (await Promise.all(unredeemedGrantsPromises)).filter(
      (p: any) => !p.withdrawn
    );

    // add up all the unredeemed tokens
    if (unredeemedGrants.length) {
      unredeemedTokens = unredeemedGrants.reduce((acc: string, p: any) => {
        return bigNumberify(acc)
          .add(parseUnits(p.tokensRequested))
          .toString();
      }, '0');
    }
  }
  // console.log('unredeemed tokens:', baseToConvertedUnits(unredeemedTokens));

  // subtract the unredeemed tokens from the projected
  // total unlocked balance at the start of the next epoch
  const projectedAvailableBalance = pUnlockedBalance.sub(unredeemedTokens);
  // console.log('projected available balance:', baseToConvertedUnits(projectedAvailableBalance));
  return projectedAvailableBalance;
}
