const { utils } = require('ethers');
const { getAllEvents } = require('../utils/transactions');
const { getNormalizedNotificationsByEvents } = require('../utils/notifications');

const numRegex = /^([^0-9]*)$/;

module.exports = {
  /**
   * Get all notifications for a user's address
   */
  getByAddress(req, res) {
    const { address } = req.params;

    try {
      utils.getAddress(address);
    } catch (error) {
      res.status(400).send(`Invalid address provided in body: ${error}`);
    }

    try {
      getAllEvents().then(events => {
        events.map(e => {
          // print out event name and block.timestamp
          console.log(e.name, e.timestamp);
          // print out event values for debugging
          Object.keys(e.values).map(arg => {
            let value = e.values[arg];
            // filter out numerical duplicates, like { 0: '0x1234', voter: '0x1234' }, and the `length` field
            if (numRegex.test(arg) && arg !== 'length') {
              if (value.hasOwnProperty('_hex')) {
                value = value.toString();
              }
              console.log(arg, value);
            }
          });
          console.log('');
        });
        console.log('events:', events.length);
        console.log('');
        getNormalizedNotificationsByEvents(events, address).then(notifications => {
          // console.log('notifications:', notifications);
          res.json(notifications);
        });
      });
    } catch (error) {
      res.status(400).send(`Error while attempting to get events: ${error}`);
    }
  },
};
