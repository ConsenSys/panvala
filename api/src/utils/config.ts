const gatekeeperAddress = process.env.GATEKEEPER_ADDRESS;
const tokenCapacitorAddress = process.env.TOKEN_CAPACITOR_ADDRESS;

export const rpcEndpoint = process.env.RPC_ENDPOINT || 'http://localhost:8545';

export const contracts = {
  gatekeeperAddress,
  tokenCapacitorAddress,
};
