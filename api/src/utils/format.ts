import { getAddress } from "ethers/utils";

export function ensureChecksumAddress(address: string | null): string | null {
  if (address != null) {
    return getAddress(address.toLowerCase());
  }

  return address;
}
