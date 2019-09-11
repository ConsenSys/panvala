const axios = require('axios');

module.exports = {
  async addContact(req, res) {
    const endpoint = 'https://api2.autopilothq.com';
    const corsHeaders = {
      'Access-Control-Allow-Origin': endpoint,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type',
    };

    const headers = {
      autopilotapikey: process.env.AUTOPILOT_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...corsHeaders,
    };

    const {
      email,
      fullName,
      txHash,
      multihash,
      memo,
      usdValue,
      ethValue,
      pledgeMonthlyUSD,
      pledgeTerm,
    } = req.body;

    const list_id = 'contactlist_dd543c0a-1c80-40d4-a386-9616fd433ec4';
    const url = `${endpoint}/v1/contact`;

    const postData = {
      contact: {
        _autopilot_list: list_id,
        Email: email,
        custom: {
          'string--memo': memo,
          'string--usdValue': usdValue,
          'string--ethValue': ethValue,
          'string--txHash': txHash,
          'string--multihash': multihash,
          'string--fullName': fullName,
          'integer--pledgeMonthlyUSD': pledgeMonthlyUSD,
          'integer--pledgeTerm': pledgeTerm,
        },
      },
    };

    try {
      const response = await axios({
        method: 'post',
        url,
        data: JSON.stringify(postData),
        headers,
      });
      // if (response.status === 200) {
      //   return response;
      // }
      // TODO: handle response status
      res.json(response.data);
    } catch (error) {
      console.error('ERROR during autopilot post request', error);
      throw error;
    }
  },
};
