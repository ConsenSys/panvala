const { checkSchema } = require('express-validator/check');
const { proposalSchema } = require('./utils/proposals');
const { ballotSchema, ballotInsertSchema } = require('./utils/ballots');

const proposal = require('./controllers/proposal');
const slate = require('./controllers/slate');
const ballot = require('./controllers/ballot');

module.exports = app => {
  app.get('/', (req, res) => {
    res.send('This is the Panvala API');
  });

  // PROPOSALS
  app.get('/api/proposals', proposal.getAll);
  app.post('/api/proposals', checkSchema(proposalSchema), proposal.create);

  // SLATES
  app.get('/api/slates', slate.getAll);

  // BALLOTS
  app.post(
    '/api/ballots',
    checkSchema(ballotSchema),
    ballot.process,
    checkSchema(ballotInsertSchema),
    ballot.create
  );
};
