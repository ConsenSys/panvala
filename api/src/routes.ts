const { sequelize } = require('./models');
import { checkSchema } from 'express-validator';

// Validation
import { proposalSchema } from './utils/proposals';
import { ballotInsertSchema } from './utils/ballots';
import { slateSchema } from './utils/slates';
import * as eth from './utils/eth';

// Controllers
import * as proposal from './controllers/proposal';
import * as slate from './controllers/slate';
import * as ballot from './controllers/ballot';
import * as notification from './controllers/notification';
import * as parameter from './controllers/parameter';
import * as ipfs from './controllers/ipfs';
import * as website from './controllers/website';
import * as token from './controllers/token';
import * as poll from './controllers/poll';
import * as epoch from './controllers/epoch';

// Routes
export const setupRoutes = app => {
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
  app.post('/api/ballots', ballot.transform, checkSchema(ballotInsertSchema), ballot.create);

  // NOTIFICATIONS
  app.get('/api/notifications/:address', notification.getByAddress);

  // IPFS
  app.get('/api/ipfs/:multihash', ipfs.getData);
  app.post('/api/ipfs', ipfs.saveData);

  // PARAMETERS
  app.get('/api/parameters', parameter.getAll);

  // Website
  app.post('/api/website', website.addContact);

  // Token
  app.get('/api/token/circulating-supply', token.circulatingSupply);

  // Polls
  app.post('/api/polls/:pollID', poll.saveResponse);
  app.get('/api/polls/:pollID/status/:account', poll.getUserStatus);

  // Epochs
  app.get('/api/epochs/:epochNumber/dates', epoch.getDates);
};
