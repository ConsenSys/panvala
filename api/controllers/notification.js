const { utils } = require('ethers');
const { getNotificationsByAddress } = require('../utils/notifications');

module.exports = {
  /**
   * Get all notifications for a user's address
   */
  getByAddress(req, res) {
    const { address } = req.params;

    try {
      const validatedAddress = utils.getAddress(address.toLowerCase());

      return getNotificationsByAddress(validatedAddress)
        .then(notifications => {
          return res.json(notifications);
        })
        .catch(error => {
          const msg = `Error while attempting to get events: ${error}`;
          console.error(msg);
          return res.status(400).send(msg);
        });
    } catch (error) {
      const msg = `Invalid address provided in body: ${error}`;
      console.error(msg);
      return res.status(400).send(msg);
    }
  },
};
