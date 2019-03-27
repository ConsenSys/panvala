const { sequelize } = require('./models');
const { checkSchema } = require('express-validator/check');

// Validation
const { proposalSchema } = require('./utils/proposals');
const { ballotSchema, ballotInsertSchema } = require('./utils/ballots');
const { slateSchema } = require('./utils/slates');
const eth = require('./utils/eth');

// Controllers
const proposal = require('./controllers/proposal');
const slate = require('./controllers/slate');
const ballot = require('./controllers/ballot');

// Routes
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
  app.post('/api/slates', checkSchema(slateSchema), slate.create);

  // BALLOTS
  app.post(
    '/api/ballots',
    ballot.process,
    checkSchema(ballotInsertSchema),
    ballot.create
  );
};
