const { checkSchema } = require('express-validator/check');
const { proposalSchema } = require('./utils/proposals');
const proposal = require('./controllers/proposal');
const slate = require('./controllers/slate');

module.exports = app => {
  app.get('/', (req, res) => {
    res.send('This is the Panvala API');
  });

  // PROPOSALS
  app.get('/api/proposals', proposal.getAll);
  app.post('/api/proposals', checkSchema(proposalSchema), proposal.create);

  // SLATES
  app.get('/api/slates', slate.getAll);
};
