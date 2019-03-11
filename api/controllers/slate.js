const { getAllSlates } = require('../utils/slates');

module.exports = {
  /**
   * Get the list of slates
   */
  async getAll(req, res) {
    getAllSlates()
      .then(slates => {
        // console.log('DATA', slates);
        res.send(slates);
      })
      .catch(err => {
        console.log('ERROR', err);
        res.status(500).json({
          err: err.message,
        });
      });
  },
};
