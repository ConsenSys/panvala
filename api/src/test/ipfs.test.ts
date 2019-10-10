import * as request from 'supertest';
import app from '../index';
import { sequelize } from '../models';
import { migrate } from '../migrate';

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

describe('GET /ipfs', () => {
  test('it should hit the root', async () => {
    const result = await request(app).get('/');
    expect(result.status).toEqual(200);
  });
});
