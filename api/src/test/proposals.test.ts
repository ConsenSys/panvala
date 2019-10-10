import * as request from 'supertest';
import app from '../index';
import * as models from '../models';
import { migrate } from '../migrate';
import { initProposals } from './utils';

const { sequelize, Proposal } = models;

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

describe('GET /api/proposals', () => {
  beforeEach(() => {
    return Proposal.truncate();
  });

  test('it should get the list of proposals', async () => {
    await initProposals();

    const result = await request(app).get('/api/proposals');

    expect(result.status).toEqual(200);
    const proposals = result.body;
    expect(proposals.length).toBe(2);
    // TODO: check the actual values
  });

  test('it should return an empty list if there are no proposals', async () => {
    const result = await request(app).get('/api/proposals');
    expect(result.status).toBe(200);
    expect(result.body).toEqual([]);
  });
});

describe('POST /api/proposals', () => {
  let data;

  beforeEach(async () => {
    // We start with 2 proposals stored
    await initProposals();

    data = {
      title: 'An ok proposal',
      summary: "I guess it's fine",
      tokensRequested: '1000000000000000000000000',
      firstName: 'Mary',
      lastName: 'Jones',
      email: 'mj@eth.io',
      github: 'maryj',
      website: 'mary.io',
      projectPlan: '2019 is gonna be good',
      projectTimeline: '2020 is gonna be great',
      teamBackgrounds: 'I do this. He does that.',
      totalBudget: '$2,000,000 for this. $100,000 for that.',
      otherFunding: 'n/a',
      awardAddress: '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7',
    };
  });

  test('it should create a new proposal', async () => {
    const result = await request(app)
      .post('/api/proposals')
      .send(data);

    expect(result.status).toEqual(200);

    const created = result.body;
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');
    expect(created).toMatchObject(data);

    const listResult = await request(app).get('/api/proposals');
    expect(listResult.body.length).toBe(3);
  });

  test('it should return a 400 if no proposal data was provided', async () => {
    const result = await request(app).post('/api/proposals');

    expect(result.status).toEqual(400);
  });

  describe('missing required fields', () => {
    const requiredFields = [
      'title',
      'summary',
      'tokensRequested',
      'firstName',
      'email',
      'awardAddress',
    ];

    test.each(requiredFields)('it should return a 400 if `%s` is null', async field => {
      data[field] = null;
      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    test.each(requiredFields)('it should return a 400 if `%s` is missing', async field => {
      data[field] = undefined;
      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    // cannot be empty strings
    test.each(requiredFields)('it should return a 400 if `%s` is an empty string', async field => {
      data[field] = '';
      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    // whitespace strings
    test.each(requiredFields)('it should return a 400 if `%s` is all whitespace', async field => {
      data[field] = '             ';
      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });
  });

  describe('missing optional fields', () => {
    const optionalFields = [
      'lastName',
      'github',
      'website',
      'projectPlan',
      'projectTimeline',
      'teamBackgrounds',
      'totalBudget',
      'otherFunding',
    ];

    test.each(optionalFields)('it should accept a missing `%s`', async field => {
      data[field] = undefined;

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(200);
    });

    test.each(optionalFields)('it should accept an empty string for `%s`', async field => {
      data[field] = '';

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(200);
    });

    test.each(optionalFields)('it should accept a null `%s`', async field => {
      data[field] = null;

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(200);
    });
  });

  describe('field validation', () => {
    // String lengths
    test('it should return a 400 if the title is longer than 80 characters', async () => {
      data.title = 'a'.repeat(90);

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the summary is longer than 5000 characters', async () => {
      data.summary = 'a'.repeat(5001);
      expect(data.summary.length).toBeGreaterThan(5000);

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    test.todo('it should return a 4000 if github is too long');
    test.todo('it should return a 4000 if lastName is too long');

    // formats
    test('it should return a 400 if `tokensRequested` is a string that cannot be parsed as a number', async () => {
      data.tokensRequested = 'a million';

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    test('it should return a 400 if `tokensRequested` is a number', async () => {
      data.tokensRequested = 1000000000000000000000000000;

      const result = await request(app)
        .post('/api/proposals')
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if `tokensRequested` a number smaller than base unit', async () => {
      data.tokensRequested = '100000000000000000';

      const result = await request(app)
        .post('/api/proposals')
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the email is invalid', async () => {
      data.email = '@abc.com';

      const result = await request(app)
        .post('/api/proposals')
        .send(data);
      expect(result.status).toBe(400);
    });

    // Stateful
    test('all proposals should have the correct datatype for tokensRequested', async () => {
      // get all added proposals
      const proposals = await Proposal.findAll();

      // check to make sure each type is a string
      proposals.forEach(p => {
        const { tokensRequested } = p;
        expect(typeof tokensRequested).toBe('string');
      });
    });
  });
});
