const request = require('supertest');
const app = require('../index');
const { sequelize, Slate } = require('../models');
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

describe('POST /api/slates', () => {
  let data;
  let route = '/api/slates';

  beforeEach(() => {
    data = {
      slateID: '1',
      metadataHash: 'QmRZxt2b1FVZPNqd8hsiykDL3TdBDeTSPX9Kv46HmX4Gx1',
      email: 'jc@example.com',
    };

    // Allow us to use the same slateID each time
    // return Slate.truncate();
  });
  afterEach(() => {
    return Slate.truncate();
  });

  test('it should save a slate', async () => {
    const result = await request(app)
      .post(route)
      .send(data);

    // console.log('RESULT', result.body);
    expect(result.status).toEqual(200);

    const created = result.body;
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    ['slateID', 'metadataHash', 'email'].forEach(property => {
      expect(created).toHaveProperty(property);
    });
  });

  test('it should not allow multiple slates with the same ID', async () => {
    await request(app)
      .post(route)
      .send(data);

    const result = await request(app)
      .post(route)
      .send(data);

    expect(result.status).toEqual(400);
  });

  describe('missing required fields', () => {
    const requiredFields = ['slateID', 'metadataHash'];

    test.each(requiredFields)('it should return a 400 if `%s` is null', async field => {
      data[field] = null;
      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(400);
    });

    test.each(requiredFields)('it should return a 400 if `%s` is missing', async field => {
      data[field] = undefined;
      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(400);
    });

    const stringFields = ['metadataHash'];

    // cannot be empty strings
    test.each(stringFields)('it should return a 400 if `%s` is an empty string', async field => {
      data[field] = '';
      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(400);
    });

    // whitespace strings
    test.each(stringFields)('it should return a 400 if `%s` is all whitespace', async field => {
      data[field] = '             ';
      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(400);
    });
  });

  describe('missing optional fields', () => {
    const optionalFields = ['email'];

    test.each(optionalFields)('it should accept a missing `%s`', async field => {
      data[field] = undefined;

      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(200);
    });

    test.each(optionalFields)('it should accept an empty string for `%s`', async field => {
      data[field] = '';

      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(200);
    });

    test.each(optionalFields)('it should accept a null `%s`', async field => {
      data[field] = null;

      const result = await request(app)
        .post(route)
        .send(data);
      expect(result.status).toBe(200);
    });
  });

  describe('field validation', () => {
    test('it should return a 400 if the email is invalid', async () => {
      data.email = 'notanemail';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toEqual(400);
    });

    test('is should accept and convert a string that parses as a number for the slateID', async () => {
      data.slateID = '1';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toEqual(200);
      const { slateID } = result.body;

      expect(typeof slateID).toEqual('number');
    });

    test('it should return a 400 if the slateID does not parse as a number', async () => {
      data.slateID = 'notanumber';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toEqual(400);
    });
  });
});
