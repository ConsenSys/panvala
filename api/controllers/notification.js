const { utils } = require('ethers');
const { getAllEvents } = require('../utils/transactions');
const { getNormalizedNotificationsByEvents } = require('../utils/notifications');

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
          console.log(e.name, e.timestamp);
        });
        console.log('');
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
