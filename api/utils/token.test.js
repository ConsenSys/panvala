const { parseUnits } = require('ethers').utils;
const { timing } = require('.');
const { linearDecay, calculateCirculatingSupply, asTokens } = require('./token');

describe('linearDecay', () => {
  const initial = 10000;
  const start = 200;
  const end = 1200;

  test('it should return the full amount at the start', () => {
    const now = start;
    const left = linearDecay(initial, start, end, now);
    expect(left.toString()).toBe(initial.toString());
  });

  test('it should return 0 at the end', () => {
    const now = end;
    const left = linearDecay(initial, start, end, now);
    expect(left.toString()).toBe('0');
  });

  test('it should return half at the midpoint', () => {
    const now = (end + start) / 2;
    const left = linearDecay(initial, start, end, now);
    expect(left.toString()).toBe('5000');
  });
});

describe('calculateCirculatingSupply', () => {
  const vestingStart = 1572627600; // 2019-11-01T17:00:00.000Z
  const vestingDurationDays = 730;
  const vestingEnd = vestingStart + vestingDurationDays * timing.durations.ONE_DAY;
  const initialUnvestedTokens = asTokens('27406303');
  const launchPartnerFundBalance = asTokens('10000000');
  const tokenCapacitorLockedBalance = asTokens('20000000');
  const totalSupply = asTokens('100000000');

  const initialLocked = initialUnvestedTokens
    .add(launchPartnerFundBalance)
    .add(tokenCapacitorLockedBalance);

  const params = {
    vestingStart,
    vestingEnd,
    initialUnvestedTokens,
    launchPartnerFundBalance,
    tokenCapacitorLockedBalance,
    totalSupply,
  };

  const initialCirculating = totalSupply.sub(initialLocked);
  const finalLocked = launchPartnerFundBalance.add(tokenCapacitorLockedBalance);
  const finalCirculating = totalSupply.sub(finalLocked);

  test('it should return the initial amount before vesting starts', () => {
    const supply = calculateCirculatingSupply({
      ...params,
      now: vestingStart - 1000,
    });

    expect(supply.toString()).toBe(initialCirculating.toString());
  });

  test('it should return the initial amount at the start of the vesting period', () => {
    const supply = calculateCirculatingSupply({
      ...params,
      now: vestingStart,
    });

    expect(supply.toString()).toBe(initialCirculating.toString());
  });

  test('it should return an intermediate amount in the middle of the vesting period', () => {
    const supply = calculateCirculatingSupply({
      ...params,
      now: (vestingStart + vestingEnd) / 2,
    });

    expect(supply.gt(initialCirculating)).toBe(true);
    expect(supply.lt(finalCirculating)).toBe(true);
  });

  test('it should include all the vested tokens at the end of the vesting period', () => {
    const supply = calculateCirculatingSupply({
      ...params,
      now: vestingEnd,
    });

    expect(supply.toString()).toBe(finalCirculating.toString());
  });

  test('it should include all the vested tokens after the end of the vesting period', () => {
    const supply = calculateCirculatingSupply({
      ...params,
      now: vestingEnd + 1000,
    });

    expect(supply.toString()).toBe(finalCirculating.toString());
  });
});
