const fs = require('fs');

function loadSchema(path) {
  const schemaData = fs.readFileSync(path);
  return JSON.parse(schemaData);
}

// Load the schemas from disk
const ballotSchema = loadSchema('schemas/ballot.json');
const proposalSchema = loadSchema('schemas/proposal.json');
const slateSchema = loadSchema('schemas/slate.json');

module.exports = {
  ballotSchema,
  proposalSchema,
  slateSchema,
}
