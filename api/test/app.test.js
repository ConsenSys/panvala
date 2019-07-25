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
