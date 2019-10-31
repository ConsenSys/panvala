import * as fs from 'fs';
import * as path from 'path';

function loadSchema(filepath) {
  const currentDir = path.resolve(__dirname);

  const schemaData = fs.readFileSync(`${currentDir}/${filepath}`);
  return JSON.parse(schemaData.toString());
}

// Load the schemas from disk
const ballotSchema = loadSchema('schemas/ballot.json');
const proposalSchema = loadSchema('schemas/proposal.json');
const slateSchema = loadSchema('schemas/slate.json');
export const pollResponseSchema = loadSchema('schemas/categoryPollResponse.json');

export { ballotSchema, proposalSchema, slateSchema };
