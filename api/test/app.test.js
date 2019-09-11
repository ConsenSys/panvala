const request = require('supertest');
const app = require('../index');
const { sequelize } = require('../models');
const { migrate } = require('../migrate');

// run migrations
beforeAll(() => {
  sequelize.options.logging = false;
  return migrate();
});

// Shut down the database
afterAll(() => {
  const q = sequelize.getQueryInterface();
  return q.dropAllTables().then(() => sequelize.close());
});

describe('GET /', () => {
  test('it should hit the root', async () => {
    const result = await request(app).get('/');
    expect(result.status).toEqual(200);
  });
});

// Check that required variables are set
describe('environment variables', () => {
  const requiredVariables = [
    'RPC_ENDPOINT',
    'AUTOPILOT_API_KEY',
    // TODO: determine if we should check for these
    // 'IPFS_HOST',
    // 'IPFS_PORT',
    // 'PANVALA_ENV',
    // 'GATEKEEPER_ADDRESS',
    // 'TOKEN_CAPACITOR_ADDRESS',
  ];

  test.each(requiredVariables)('%s', async variable => {
    const value = process.env[variable];
    expect(value).toBeDefined();
  });
});
