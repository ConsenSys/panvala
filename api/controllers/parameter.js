const { getContracts } = require('../utils/eth');
const {
  contracts: { genesisBlockNumber },
} = require('../utils/config');

module.exports = {
  async getAll(req, res) {
    const { gatekeeper } = getContracts();

    // get the parameter store associated with the gatekeeper
    const psAddress = await gatekeeper.functions.parameters();

    // get parameter store events
    const params = getParameterStoreEvents(psAddress, genesisBlockNumber);
    console.log('params:', params);

    res.send(JSON.stringify(params));
  },
};
