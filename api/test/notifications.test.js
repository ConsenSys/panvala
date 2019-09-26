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

describe('GET /api/notifications/:address', () => {
  const address = '0xd09cc3Bc67E4294c4A446d8e4a2934a921410eD7';
  let baseRoute = '/api/notifications';

  // TODO: put some data in the database first

  test('it should get notifications', async () => {
    const route = `${baseRoute}/${address}`;
    const result = await request(app).get(route);

    // console.log('RESULT', result.body);
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
  });

  test('it should reject an invalid address', async () => {
    const invalidAddress = '0xabcd';
    const route = `${baseRoute}/${invalidAddress}`;
    const result = await request(app).get(route);

    // console.log('RESULT', result.body);
    expect(result.status).toBe(400);
  });
});
