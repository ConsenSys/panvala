import { ethers, providers } from 'ethers';
import { IContracts } from '../interfaces';
import getConfig from 'next/config';
import { panvala_utils } from '.';
import { ParameterStore, TokenCapacitor, Gatekeeper, BasicToken } from '../types';

// Defaults are a workaround for https://github.com/zeit/next.js/issues/4024
const { publicRuntimeConfig = {} } = getConfig() || {};

// get contract abis from panvala-utils
const abis: any = panvala_utils.contractABIs;

// contract abstractions for gate_keeper and token_capacitor
export async function connectContracts(provider: providers.Web3Provider): Promise<IContracts> {
  const [tcAbi, gcAbi, tokenAbi, paramsAbi]: [any[], any[], any[], any[]] = [
    abis.TokenCapacitor.abi,
    abis.TimeTravelingGatekeeper.abi,
    abis.BasicToken.abi,
    abis.ParameterStore.abi,
  ];

  // read addresses from env vars
  const gcAddress: string =
    publicRuntimeConfig.gatekeeperAddress || process.env.STORYBOOK_GATEKEEPER_ADDRESS;
  const tcAddress: string =
    publicRuntimeConfig.tokenCapacitorAddress || process.env.STORYBOOK_TOKEN_CAPACITOR_ADDRESS;

  try {
    await provider.getCode(tcAddress);
  } catch (error) {
    throw new Error(`ERROR no code at: ${tcAddress}`);
  }
  // init ethers contract abstractions
  const tc: ethers.Contract = new ethers.Contract(tcAddress, tcAbi, provider);
  const gc: ethers.Contract = new ethers.Contract(gcAddress, gcAbi, provider);

  // connect metamask wallet/signer to contracts
  const signer: providers.JsonRpcSigner = provider.getSigner();
  const tokenCapacitor: TokenCapacitor = tc.connect(signer) as TokenCapacitor;
  const gatekeeper: Gatekeeper = gc.connect(signer) as Gatekeeper;

  // get the token and parameter_store associated with the gate_keeper
  try {
    const tokenAddress: string = await gc.functions.token();
    const tokenContract: ethers.Contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    // connect metamask wallet/signer to token contract
    const token: BasicToken = tokenContract.connect(signer) as BasicToken;

    const paramsAddress: string = await gc.functions.parameters();
    const parameterStoreContract: ethers.Contract = new ethers.Contract(
      paramsAddress,
      paramsAbi,
      provider
    );
    const parameterStore: ParameterStore = parameterStoreContract.connect(signer) as ParameterStore;

    return { tokenCapacitor, gatekeeper, token, parameterStore };
  } catch (error) {
    console.error(`ERROR while attempting to connect token or parameter store: ${error.message}`);
    throw error;
  }
}

// ethers-metamask-provider
// connects to whichever network metamask is connected to
export async function connectProvider(ethereumProvider: any): Promise<providers.Web3Provider> {
  const ethProvider: providers.Web3Provider = new providers.Web3Provider(ethereumProvider);
  return ethProvider;
}
