import { utils } from 'ethers';
import { BigNumber } from 'ethers/utils';

export function splitAddressHumanReadable(address: string): string {
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

export function convertedToBaseUnits(converted: string, decimals: number): string {
  // expects converted: string, throws on failure to convert
  return utils.parseUnits(converted, decimals).toString();
}

export function baseToConvertedUnits(base: BigNumber, decimals: number): string {
  // expects base: BigNumberish, throws on failure to convert
  return utils.formatUnits(base, decimals).toString();
}

export function formatPanvalaUnits(base: BigNumber) {
  const converted: string = baseToConvertedUnits(base, 18);

  return converted + ' PAN';
}
