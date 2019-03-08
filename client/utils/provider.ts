import { ethers, providers, Signer, Contract } from 'ethers';
import { IContracts } from '../interfaces';
import getConfig from 'next/config';

const TokenCapacitor = require('./abis/TokenCapacitor.json');
const Gatekeeper = require('./abis/Gatekeeper.json');

// Defaults are a workaround for https://github.com/zeit/next.js/issues/4024
const { publicRuntimeConfig = {} } = getConfig() || {};

// contract abstractions for gate_keeper and token_capacitor
export function connectContracts(provider: providers.Web3Provider): IContracts {
  const tcAbi: any[] = TokenCapacitor.abi;
  const gcAbi: any[] = Gatekeeper.abi;

  // read addresses from env vars
  const gcAddress: string =
    publicRuntimeConfig.gatekeeperAddress || '0x8A3f7Ad6b368A6043D0D60Fda425c90DE6126005';
  const tcAddress: string =
    publicRuntimeConfig.tokenCapacitorAddress || '0xAabC1fE9c4A43CaFF0D70206B7C7D18E9A279894';

  // init ethers contract abstractions w/ metamask signer
  const signer: Signer = provider.getSigner();
  const tc: Contract = new ethers.Contract(tcAddress, tcAbi, provider);
  const gc: Contract = new ethers.Contract(gcAddress, gcAbi, provider);
  // connect metamask wallet/signer to contracts
  const tokenCapacitor: Contract = tc.connect(signer);
  const gateKeeper: Contract = gc.connect(signer);

  return { tokenCapacitor, gateKeeper };
}

// ethers-metamask-provider
// connects to whichever network metamask is connected to
export async function connectProvider(ethereumProvider: any): Promise<providers.Web3Provider> {
  const ethProvider: providers.Web3Provider = new providers.Web3Provider(ethereumProvider);
  return ethProvider;
}
