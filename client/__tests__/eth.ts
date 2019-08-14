import Ganache from 'ganache-core';
import { providers, Wallet } from 'ethers';
import { ParameterStore, TokenCapacitor, Gatekeeper, BasicToken } from '../types';
import {
  BN,
  abiEncode,
  newToken,
  newParameterStore,
  newGatekeeper,
  newTokenCapacitor,
  tokenDistributions,
} from './helpers';

const defaultOptions = {
  mnemonic:
    process.env.MNEMONIC ||
    'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
  port: 7545,
  network_id: 420,
  locked: false,
  gasLimit: BN('7000000').toHexString(),
};

function Eth(options = defaultOptions) {
  const ganache = Ganache.provider(options);
  const provider = new providers.Web3Provider(ganache);
  // const provider = new providers.JsonRpcProvider('http://localhost:8545');
  const signer = Wallet.fromMnemonic(options.mnemonic).connect(provider);

  let token: BasicToken,
    gatekeeper: Gatekeeper,
    tokenCapacitor: TokenCapacitor,
    parameterStore: ParameterStore;

  async function initContracts() {
    token = (await newToken(signer)) as BasicToken;
    parameterStore = (await newParameterStore(signer)) as ParameterStore;

    gatekeeper = (await newGatekeeper(signer, parameterStore, token.address)) as Gatekeeper;
    await parameterStore.setInitialValue(
      'gatekeeperAddress',
      abiEncode('address', gatekeeper.address)
    );

    tokenCapacitor = (await newTokenCapacitor(signer, parameterStore, token)) as TokenCapacitor;
    await parameterStore.setInitialValue(
      'tokenCapacitorAddress',
      abiEncode('address', tokenCapacitor.address)
    );

    await token.transfer(tokenCapacitor.address, tokenDistributions.initialTcBalance.toString());

    await tokenCapacitor.updateBalances();
    await parameterStore.init();

    return { ganache, provider, token, parameterStore, gatekeeper, tokenCapacitor };
  }

  async function getChainId() {
    if (process.env.NODE_ENV !== 'test') {
      const network = await provider.getNetwork();
      return network.chainId;
    } else {
      return options.network_id;
    }
  }

  return Object.freeze({
    getChainId,
    ganache,
    provider,
    initContracts,
  });
}

const eth = Eth();

export { eth };
