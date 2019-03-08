const { getAllSlates } = require('../utils/slates');

module.exports = {
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
