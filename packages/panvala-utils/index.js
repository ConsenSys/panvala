const { voting, timing } = require('./dist');
const BasicToken = require('./abis/BasicToken.json');
const Gatekeeper = require('./abis/Gatekeeper.json');
const TokenCapacitor = require('./abis/TokenCapacitor.json');
const ParameterStore = require('./abis/ParameterStore.json');
const TimeTravelingGatekeeper = require('./abis/TimeTravelingGatekeeper.json');
const UniswapExchange = require('./abis/UniswapExchange.json');

module.exports = {
  voting,
  timing,
  contractABIs: {
    BasicToken,
    Gatekeeper,
    TokenCapacitor,
    ParameterStore,
    TimeTravelingGatekeeper,
    UniswapExchange,
  },
};
