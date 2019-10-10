import { utils } from 'ethers';
import { BigNumberish } from 'ethers/utils';

export function isAddress(address: string): boolean {
  try {
    utils.getAddress(address);
    return true;
  } catch (error) {}
  return false;
}

export function splitAddressHumanReadable(address: string): string {
  if (!isAddress(address)) {
    return 'invalid address';
  }
  // 0xd115bffabbdd893a6f7cea402e7338643ced44a6
  const addr = utils.getAddress(address);
  // 0xD115BFFAbbdd893A6f7ceA402e7338643Ced44a6

  const prefix = addr.slice(0, 2);
  // 0x
  const remaining = addr.slice(2).toUpperCase();
  // D115BFFAbbdd893A6f7ceA402e7338643Ced44a6

  const fourChars: any = remaining.match(/.{1,4}/g);
  const joined = [prefix].concat(fourChars).join(' ');
  // 0x D115 BFFA bbdd 893A 6f7c eA40 2e73 3864 3Ced 44a6
  return joined;
}

export function convertedToBaseUnits(converted: string, decimals: number = 18): string {
  // expects converted: string, throws on failure to convert
  return utils.parseUnits(converted, decimals).toString();
}

export function baseToConvertedUnits(base: BigNumberish, decimals: number = 18): string {
  // expects base: BigNumberish, throws on failure to convert
  const converted = utils.formatUnits(base, decimals).toString();
  const point = converted.indexOf('.');
  const integer = converted.slice(0, point);
  const fractional = converted.slice(point, point + 3);
  return integer + fractional;
}

export function formatPanvalaUnits(base: BigNumberish): string {
  const converted: string = baseToConvertedUnits(base, 18);

  return converted + ' PAN';
}

export const BN = (small: BigNumberish) => utils.bigNumberify(small);

export type ParameterFormat = 'uint256' | 'address';

export const formatParameter = (value: any, type: ParameterFormat): string => {
  if (type === 'uint256') {
    return formatPanvalaUnits(value);
  } else if (type === 'address') {
    return utils.getAddress(value);
  } else {
    return value;
  }
};

export const { getAddress } = utils;

const parameterDisplayNames = {
  slateStakeAmount: 'Slate Stake Amount',
  gatekeeperAddress: 'Gatekeeper Address',
};

export function parameterDisplayName(key: string): string {
  return parameterDisplayNames[key] || key;
}
