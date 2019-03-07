const gatekeeperAddress =
  process.env.GATEKEEPER_ADDRESS || '0x8A3f7Ad6b368A6043D0D60Fda425c90DE6126005';
const tokenCapacitorAddress =
  process.env.TOKEN_CAPACITOR_ADDRESS || '0xAabC1fE9c4A43CaFF0D70206B7C7D18E9A279894';

const rpcEndpoint = process.env.RPC_ENDPOINT || 'http://localhost:8545';

module.exports = {
  contracts: {
    gatekeeperAddress,
    tokenCapacitorAddress,
  },
  rpcEndpoint,
};
