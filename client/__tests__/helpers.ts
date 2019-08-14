import { utils, Contract, ContractFactory, Signer } from 'ethers';
import { BigNumberish, BigNumber, defaultAbiCoder } from 'ethers/utils';
import { contractABIs } from '../../packages/panvala-utils';

// UNITS
// -----------------------------------------------------------------------
export function BN(small: BigNumberish): BigNumber {
  return utils.bigNumberify(small);
}
export function fromBaseUnits(converted: BigNumberish): string {
  return utils.formatUnits(converted, 18);
}
export function toBaseUnits(base: string): BigNumber {
  return utils.parseUnits(base, 18);
}
export function abiEncode(type, value) {
  return defaultAbiCoder.encode([type], [value]);
}

// LOCAL RPC
// -----------------------------------------------------------------------
export const evmSnapshot = async provider => provider.send('evm_snapshot', []);

export const evmRevert = (provider, snapshotID) => provider.send('evm_revert', [snapshotID]);

export const increaseTime = async (provider, seconds) => {
  const adjustment = await provider.send('evm_increaseTime', [seconds.toNumber()]);
  await provider.send('evm_mine', []);
  return adjustment;
};

// CONTRACTS
// -----------------------------------------------------------------------
const abis: any = contractABIs;

export const tokenDistributions = {
  totalSupply: toBaseUnits('100000000'),
  slateStakeAmount: toBaseUnits('50000'),
  initialTcBalance: toBaseUnits('50000000'),
  initialUnlockedBalance: toBaseUnits('1000000'),
};

function getFactory(abi, bytecode, signer) {
  return new ContractFactory(abi, bytecode, signer);
}

export async function newToken(signer: Signer): Promise<Contract> {
  const { abi, bytecode } = abis.BasicToken;
  const factory = getFactory(abi, bytecode, signer);
  return factory.deploy('Testcoin', 'TEST', '18', tokenDistributions.totalSupply);
}

export async function newParameterStore(signer: Signer): Promise<Contract> {
  const { abi, bytecode } = abis.ParameterStore;
  const names = ['slateStakeAmount'];
  const values = [abiEncode('uint256', tokenDistributions.slateStakeAmount)];
  const factory = getFactory(abi, bytecode, signer);
  return factory.deploy(names, values);
}

export async function newGatekeeper(
  signer: Signer,
  parameterStore: any,
  tokenAddress: string
): Promise<Contract> {
  const { abi, bytecode } = abis.Gatekeeper;
  const factory = getFactory(abi, bytecode, signer);
  const firstEpochTime: any = new Date('12:00 01 Feb 2019 EST');
  const startTime = Math.floor(firstEpochTime / 1000);
  return factory.deploy(startTime, parameterStore.address, tokenAddress);
}

export async function newTokenCapacitor(
  signer: Signer,
  parameterStore: any,
  token: any
): Promise<Contract> {
  const { abi, bytecode } = abis.TokenCapacitor;
  const factory = getFactory(abi, bytecode, signer);
  return factory.deploy(
    parameterStore.address,
    token.address,
    tokenDistributions.initialUnlockedBalance
  );
}
