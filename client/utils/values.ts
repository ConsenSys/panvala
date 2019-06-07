import { utils } from 'ethers';

export function abiEncode(type: string, value: any) {
  return utils.defaultAbiCoder.encode([type], [value]);
}
