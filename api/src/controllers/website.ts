import axios from 'axios';

export async function addContact(req, res) {
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
    firstName,
    lastName,
    txHash,
    multihash,
    memo,
    usdValue,
    ethValue,
    pledgeMonthlyUSD,
    pledgeTerm,
    pledgeType,
  } = req.body;

  let list_id;
  if (process.env.NODE_ENV === 'production') {
    if (pledgeType === 'sponsorship') {
      list_id = 'contactlist_d286ca3a-463a-43e2-a216-dabc3b89e3a5';
    } else {
      list_id = 'contactlist_dd543c0a-1c80-40d4-a386-9616fd433ec4';
    }
  } else {
    if (pledgeType === 'sponsorship') {
      list_id = 'contactlist_49599a11-7d49-4108-9f70-9c4d2c124ca8';
    } else {
      list_id = 'contactlist_a4e5fd5f-50bd-4894-8f5e-85b7cfb61f5c';
    }
  }
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
        'string--firstName': firstName,
        'string--lastName': lastName,
        'integer--pledgeMonthlyUSD': pledgeMonthlyUSD,
        'integer--pledgeTerm': pledgeTerm,
      },
    },
  };

  try {
    const response = await axios({
      method: 'POST',
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
}
