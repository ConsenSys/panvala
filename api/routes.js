const { sequelize } = require('./models');
const { checkSchema } = require('express-validator/check');
const { proposalSchema } = require('./utils/proposals');
const proposal = require('./controllers/proposal');
const slate = require('./controllers/slate');

const eth = require('./utils/eth');

module.exports = app => {
  app.get('/', (req, res) => {
    res.send('This is the Panvala API');
  });

  /**
   * Readiness probe
   * Return 200 once the application is ready
   */
  app.get('/ready', (req, res) => {
    const dbCheck = sequelize
      .authenticate()
      .then(() => {
        console.log('Connection has been established successfully.');
      })
      .catch(err => {
        const msg = 'Unable to connect to the database';
        console.error(msg, err);
        throw new Error(msg);
      });

    const ethCheck = eth.checkConnection().catch(err => {
      const msg = 'Unable to reach the Ethereum network';
      console.error(msg, err);
      throw new Error(msg);
    });

    Promise.all([dbCheck, ethCheck])
      .then(() => {
        res.send('ok');
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Not ready');
      });
  });

  // PROPOSALS
  app.get('/api/proposals', proposal.getAll);
  app.post('/api/proposals', checkSchema(proposalSchema), proposal.create);

  // SLATES
  app.get('/api/slates', slate.getAll);
};
