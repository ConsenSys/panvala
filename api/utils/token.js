const ethers = require('ethers');
const { getContracts, contractABIs } = require('./eth');
const { timing } = require('.');

const { bigNumberify: BN, parseUnits } = ethers.utils;
const { BasicToken: Token } = contractABIs;

const zero = BN(0);
const asTokens = amount => parseUnits(amount, '18');

function linearDecay(total, start, end, x) {
  const _end = BN(end);
  const _x = BN(x);
  const num = BN(total).mul(_end.sub(_x));
  const den = _end.sub(BN(start));
  return num.div(den);
}

function calculateCirculatingSupply(params) {
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
async function circulatingSupply() {
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

  const now = Math.floor(new Date() / 1000);

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

module.exports = {
  linearDecay,
  calculateCirculatingSupply,
  circulatingSupply,
  asTokens,
};
