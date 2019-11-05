import * as request from 'supertest';
import app from '../index';

import { migrate } from '../migrate';
import {
  getCategories,
  createCategory,
  createEmptyPoll,
  addPollOption,
  getCategoryByName,
  createPoll,
  addPollResponse,
  IPollData,
  responseCount,
  ICategoryAllocation,
  IPollResponse,
  IDBPollResponse,
  createSignedResponse,
  hasAccountRespondedToPoll,
} from '../utils/polls';
import { someAddress, getWallet } from './utils';

const { sequelize, FundingCategory, CategoryPoll } = require('../models');

const categoryNames = [
  'Ethereum 2.0',
  'Layer 2 Scaling',
  'Security',
  'Developer Tools and Growth',
  'Dapps and Usability',
  'Panvala',
];

beforeAll(() => {
  sequelize.options.logging = false;

  return migrate().then(() => {
    const q = sequelize.getQueryInterface();

    // initialize categories
    return q.bulkInsert(
      FundingCategory.tableName,
      categoryNames.map(name => {
        return {
          displayName: name,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
      {}
    );
  });
});

afterAll(() => {
  const q = sequelize.getQueryInterface();
  return q.dropAllTables().then(() => sequelize.close());
});

beforeEach(async () => {
  // console.log('===== truncate polls table =====');
  return CategoryPoll.truncate();
});

const allocations: ICategoryAllocation[] = [
  { categoryID: 1, points: 34 },
  { categoryID: 2, points: 5 },
  { categoryID: 3, points: 16 },
  { categoryID: 4, points: 4 },
  { categoryID: 5, points: 4 },
  { categoryID: 6, points: 37 },
];

describe('API endpoints', () => {
  // GET polls/:pollID
  // GET polls/:pollID/voted/:account
  describe('POST /api/polls/:pollID', () => {
    const baseRoute = '/api/polls';
    let pollID: number;
    let route: string;
    let data: IPollData;
    let response: IPollResponse;
    let wallet;

    beforeEach(async () => {
      wallet = getWallet();

      const poll = await createPoll('Awesome poll', categoryNames);
      pollID = poll.id;
      route = `${baseRoute}/${pollID}`;

      response = {
        account: wallet.address,
        allocations,
      };

      data = await createSignedResponse(wallet, { ...response, pollID });
    });

    test('should create a poll response', async () => {
      const result = await request(app)
        .post(route)
        .send(data);

      // console.log('RESULT', result.body);
      expect(result.ok).toBe(true);

      const created = result.body;
      expect(created).toHaveProperty('createdAt');
      expect(created).toHaveProperty('updatedAt');

      ['pollID', 'account', 'allocations'].forEach(property => {
        expect(created).toHaveProperty(property);
      });

      const numResponses = await responseCount(pollID);
      expect(numResponses).toBe(1);
    });

    test('it should return 404 if the poll does not exist', async () => {
      const badPollID = 9999;
      route = `${baseRoute}/${badPollID}`;

      // check status
      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(404);
    });

    test('it should return 404 if the poll ID is invalid', async () => {
      const badPollID = 'x';
      route = `${baseRoute}/${badPollID}`;

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(404);
    });

    test('it should return 403 if the account has already responded to the poll', async () => {
      await addPollResponse({ ...data.response, pollID });

      const result = await request(app)
        .post(route)
        .send(data);

      console.log(result.body);
      expect(result.status).toBe(403);
    });

    // invalid shape
    describe('invalid shape', () => {
      const requiredFields = ['signature', 'response'];

      test.each(requiredFields)('it should return a 400 if `%s` is missing', async field => {
        data[field] = undefined;

        const result = await request(app)
          .post(route)
          .send(data);
        expect(result.status).toBe(400);
      });
    });

    // invalid inputs
    test('should reject the response if the signature does not match the data', async () => {
      const badSignature = `0x${'a'.repeat(130)}`;
      expect(badSignature).not.toBe(data.signature);

      data.signature = badSignature;

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(403);
      expect(result.body.msg).toEqual(expect.stringContaining('Signature does not match'));
    });

    test('should reject the response if it allocates to invalid categories', async () => {
      data.response.allocations = [
        { categoryID: 1, points: 34 },
        { categoryID: 2, points: 5 },
        { categoryID: 3, points: 16 },
        { categoryID: 4, points: 4 },
        { categoryID: 5, points: 4 },
        { categoryID: 7, points: 37 },
      ];

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
      expect(result.body.msg).toEqual(expect.stringContaining('must match poll options'));
    });

    test('should reject the response if it has the wrong number of allocations', async () => {
      data.response.allocations = [{ categoryID: 1, points: 50 }, { categoryID: 2, points: 50 }];

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
      expect(result.body.msg).toEqual(expect.stringContaining('must match number of poll options'));
    });

    test('should reject the response if the points do not add up to 100', async () => {
      data.response.allocations = [
        { categoryID: 1, points: 20 },
        { categoryID: 2, points: 5 },
        { categoryID: 3, points: 16 },
        { categoryID: 4, points: 4 },
        { categoryID: 5, points: 4 },
        { categoryID: 6, points: 37 },
      ];

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
      expect(result.body.msg).toEqual(expect.stringContaining('add up to 100'));
    });

    const categoryIDTests = [
      ['are not numbers', 'x'],
      ['are not integers', 1.1],
      ['are less than 1', 0],
      ['are negative integers', -20],
    ];

    test.each(categoryIDTests)(
      'should reject the response if any of the category IDs %s',
      async (_, badValue: number) => {
        data.response.allocations = [
          { categoryID: badValue, points: 34 },
          { categoryID: 2, points: 5 },
          { categoryID: 3, points: 16 },
          { categoryID: 4, points: 4 },
          { categoryID: 5, points: 4 },
          { categoryID: 6, points: 37 },
        ];

        const result = await request(app)
          .post(route)
          .send(data);

        expect(result.status).toBe(400);
      }
    );

    const pointsTests = [
      ['are not numbers', 'x'],
      ['are not integers', 1.1],
      ['are negative integers', -20],
      ['are greater than 100', 101],
    ];

    test.each(pointsTests)(
      'should reject the response if any of the points %s',
      async (_, badValue: number) => {
        data.response.allocations = [
          { categoryID: 1, points: badValue },
          { categoryID: 2, points: 5 },
          { categoryID: 3, points: 16 },
          { categoryID: 4, points: 4 },
          { categoryID: 5, points: 4 },
          { categoryID: 6, points: 37 },
        ];

        const result = await request(app)
          .post(route)
          .send(data);

        expect(result.status).toBe(400);
        expect(result.body.msg).toEqual(expect.stringContaining('Invalid poll response'));
      }
    );
  });

  describe('GET /api/polls/:pollID/status/:account', () => {
    const baseRoute = '/api/polls';
    let pollID: number;
    let route: string;
    let data: IPollData;
    let response: IDBPollResponse;
    let wallet;

    beforeEach(async () => {
      wallet = getWallet();

      const poll = await createPoll('Awesome poll', categoryNames);
      pollID = poll.id;

      const account = wallet.address;
      route = `${baseRoute}/${pollID}/status/${account}`;

      response = {
        account,
        pollID,
        allocations,
      };

      data = await createSignedResponse(wallet, response);
    });

    test('should return the status for an account that has not responded', async () => {
      const result = await request(app)
        .get(route)
        .send(data);

      expect(result.ok).toBe(true);

      const status = result.body;
      expect(status.responded).toBe(false);
    });

    test('should return the status for an account that has responded', async () => {
      // respond
      await addPollResponse(response);

      // check status
      const result = await request(app)
        .get(route)
        .send(data);

      expect(result.ok).toBe(true);

      const status = result.body;
      expect(status.responded).toBe(true);
    });

    test('it should return 404 if the account is invalid', async () => {
      await addPollResponse(response);

      const badAccount = '0xabc';
      route = `${baseRoute}/${pollID}/status/${badAccount}`;

      // check status
      const result = await request(app)
        .get(route)
        .send(data);

      expect(result.status).toBe(404);
    });

    test('it should return 404 if the poll does not exist', async () => {
      const badPollID = 9999;
      route = `${baseRoute}/${badPollID}/status/${wallet.address}`;

      // check status
      const result = await request(app)
        .get(route)
        .send(data);

      expect(result.status).toBe(404);
    });
  });
});

// test utilities
describe('poll utilities', () => {
  let categoriesAdded = 0;

  test('it should list categories', async () => {
    const cats = await getCategories();
    // console.log(cats);
    expect(cats.length).toBe(categoryNames.length);
    expect(cats.map(c => c.displayName)).toEqual(categoryNames);
  });

  test('it should add a new category', async () => {
    const name = 'Breakfast foods';
    await createCategory(name);
    categoriesAdded += 1;

    const cats = await getCategories();
    expect(cats.length).toBe(categoryNames.length + categoriesAdded);
  });

  // disallow duplicates

  test('it should add a new category poll', async () => {
    const poll = await createEmptyPoll('My Poll');
    expect(poll.name).toBe('My Poll');

    const options = await poll.getOptions();
    expect(options.length).toBe(0);

    const pollCount = await CategoryPoll.count();
    expect(pollCount).toBe(1);
  });

  describe('draft poll', () => {
    let pollID: number;

    beforeEach(async () => {
      const poll = await createEmptyPoll('Empty poll');
      pollID = poll.id;
    });

    test('it should allow adding options to the poll', async () => {
      const poll = await addPollOption(pollID, 'Ethereum 2.0');

      expect(poll.options.length).toBe(1);
      const [option] = poll.options;

      expect(option.categoryID).toBe(1);
      expect(option.pollID).toBe(pollID);
    });

    test('it should fail if the poll does not exist', async () => {
      const badPollID = 10000;
      await expect(addPollOption(badPollID, 'Ethereum 2.0')).rejects.toThrow();
    });

    test('it should add the category if it does not exist', async () => {
      const category = 'Pets';
      const origCategory = await getCategoryByName(category);
      expect(origCategory).toBe(null);

      await addPollOption(pollID, category);
      const newCategory = await getCategoryByName(category);
      expect(newCategory.displayName).toBe(category);

      const cats = await getCategories();

      categoriesAdded += 1;
      expect(cats.length).toBe(categoryNames.length + categoriesAdded);
    });

    test('it should allow creating a poll with options', async () => {
      const poll = await createPoll('Poll', categoryNames);
      // console.log(poll.get({ plain: true }));

      expect(poll.options.length).toBe(categoryNames.length);
    });

    test.todo('it should fail if the option already exists on the poll');
    test.todo('it should not allow adding responses');
  });

  describe('active poll', () => {
    let pollID: number;
    let poll;
    let response: IDBPollResponse;

    beforeEach(async () => {
      poll = await createPoll('Poll', categoryNames);
      pollID = poll.id;

      response = {
        account: someAddress,
        pollID,
        allocations: [
          { categoryID: 1, points: 34 },
          { categoryID: 2, points: 5 },
          { categoryID: 3, points: 16 },
          { categoryID: 4, points: 4 },
          { categoryID: 5, points: 4 },
          { categoryID: 6, points: 37 },
        ],
      };
    });

    test('it should be able to add responses', async () => {
      const storedResponse = await addPollResponse(response);

      const numResponses = await responseCount(pollID);
      expect(numResponses).toBe(1);
      expect(storedResponse.allocations.length).toBe(response.allocations.length);
    });

    test.todo('it should not be able to add more options');

    test('it should fail if the number of allocations does not match the number of options', async () => {
      response.allocations = [
        { categoryID: 1, points: 34 },
        { categoryID: 2, points: 5 },
        { categoryID: 3, points: 16 },
        { categoryID: 4, points: 4 },
        { categoryID: 5, points: 4 },
      ];

      await expect(addPollResponse(response)).rejects.toThrow();
    });

    test('it should fail if `account` is an empty string', async () => {
      response.account = '';

      await expect(addPollResponse(response)).rejects.toThrow();
    });

    test.todo('it should not allow multiple allocations to the same option');

    test('it should not allow multiple responses from the same account', async () => {
      await addPollResponse(response);

      await expect(addPollResponse(response)).rejects.toThrow();
    });

    describe('hasAccountRespondedToPoll', () => {
      test('it should return true if the account has responded', async () => {
        await addPollResponse(response);
        const responded = await hasAccountRespondedToPoll(pollID, response.account);
        expect(responded).toBe(true);
      });

      test('it should return false if the account has not responded', async () => {
        const responded = await hasAccountRespondedToPoll(pollID, response.account);
        expect(responded).toBe(false);
      });
    });

    // publish an empty poll
  });
});

// add a category
// add a poll
// publish a poll
// add some responses
