const { getParametersSet } = require('../utils/events');

module.exports = {
  async getAll(req, res) {
    // get parameter store events
    const params = await getParametersSet();
    console.log('params:', params);

    res.send(JSON.stringify(params));
  },
};
