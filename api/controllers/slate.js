const { validationResult } = require('express-validator/check');

const { getAllSlates } = require('../utils/slates');
const { Slate } = require('../models');

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
        console.error('ERROR', err);
        res.status(500).json({
          err: err.message,
        });
      });
  },

  /**
   * Save slate information to the database
   *
   * Fails if a row with the given slateID already exists.
   */
  async save(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const data = req.body;

    Slate.create(data)
      .then(s => {
        res.send(s);
      })
      .catch(err => {
        console.error('ERROR', err);
        res.status(400).send(`Improper slate format: ${err}`);
      });
  },
};
