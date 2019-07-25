const voting = require('./dist/voting');
const timing = require('./dist/timing');
const BasicToken = require('./abis/BasicToken.json');
const Gatekeeper = require('./abis/Gatekeeper.json');
const TokenCapacitor = require('./abis/TokenCapacitor.json');
const ParameterStore = require('./abis/ParameterStore.json');
const TimeTravelingGatekeeper = require('./abis/TimeTravelingGatekeeper.json');

module.exports = {
  voting,
  timing,
  contractABIs: {
    BasicToken,
    Gatekeeper,
    TokenCapacitor,
    ParameterStore,
    TimeTravelingGatekeeper,
  },
};
