const { getContracts } = require('../utils/eth');
const { getParametersSet } = require('../utils/events');

module.exports = {
  async getAll(req, res) {
    const { gatekeeper, genesisBlockNumber } = await getContracts();

    // get the parameter store associated with the gatekeeper
    const psAddress = await gatekeeper.functions.parameters();

    // get parameter store events
    const params = getParametersSet(psAddress, genesisBlockNumber);
    console.log('params:', params);

    res.send(JSON.stringify(params));
  },
};
