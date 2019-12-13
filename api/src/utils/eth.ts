import * as ethers from 'ethers';
import { contracts, rpcEndpoint } from './config';
import { contractABIs } from '.';
import { IGatekeeper, IParameterStore, ITokenCapacitor, IUniswapExchange } from '../types';

const { gatekeeperAddress, tokenCapacitorAddress } = contracts;
const { Gatekeeper, TokenCapacitor, ParameterStore, UniswapExchange } = contractABIs;

/**
 * Check connection
 */
function checkConnection() {
  // console.log('Connecting to', rpcEndpoint);
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

  return provider.getBlockNumber();
}

const genBlocks = {
  1: 8392794, // https://etherscan.io/tx/0xbc5870bb3e40f9f81146b018739d274c10f672c33c1128c52aeb750311cdfa45
  4: 4922926, // https://rinkeby.etherscan.io/tx/0xb120388b78f9fc9d75447c06817e590237635338f43720e4d85d6c83d4393ffc
  unknown: 1,
};

async function getContracts() {
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const network = await provider.getNetwork();
  const gatekeeper: IGatekeeper = new ethers.Contract(
    gatekeeperAddress,
    Gatekeeper.abi,
    provider
  ) as IGatekeeper;
  const parameterStoreAddress = await gatekeeper.parameters();
  const parameterStore: IParameterStore = new ethers.Contract(
    parameterStoreAddress,
    ParameterStore.abi,
    provider
  ) as IParameterStore;
  const tokenCapacitor: ITokenCapacitor = new ethers.Contract(
    tokenCapacitorAddress,
    TokenCapacitor.abi,
    provider
  ) as ITokenCapacitor;

  const uniswapExchangeAddress =
    network.chainId === 4
      ? '0xA062C59F42a45f228BEBB6e7234Ed1ea14398dE7' // rinkeby
      : network.chainId === 1
      ? '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7' // mainnet
      : '';

  let exchange: IUniswapExchange | undefined;
  if (uniswapExchangeAddress) {
    exchange = new ethers.Contract(
      uniswapExchangeAddress,
      UniswapExchange.abi,
      provider
    ) as IUniswapExchange;
  }

  const genesisBlockNumber: number = genBlocks[network.chainId] || genBlocks.unknown;

  return {
    provider,
    network,
    rpcEndpoint,
    parameterStore,
    gatekeeper,
    tokenCapacitor,
    genesisBlockNumber,
    exchange,
  };
}

export { checkConnection, getContracts, contractABIs };
