const request = require('supertest');
const { Wallet } = require('ethers');
const { voting } = require('../../packages/panvala-utils');

const app = require('../index');
const { sequelize, Proposal, Slate } = require('../models');
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

// TODO: split this up into multiple files

describe('GET /', () => {
  test('it should hit the root', async () => {
    const result = await request(app).get('/');
    expect(result.status).toEqual(200);
  });
});

function initProposals() {
  const proposals = [
    {
      title: 'An amazing proposal',
      summary: 'All sorts of amazing things',
      tokensRequested: '200000000000000000000000',
      firstName: 'John',
      lastName: 'Crypto',
      email: 'jc@eth.io',
      github: 'jcrypto',
      website: 'jc.io',
      projectPlan: '2019 is gonna launch',
      projectTimeline: '2020 is gonna moon',
      teamBackgrounds: 'I do this. She does that.',
      totalBudget: '$1,000,000 for this. $500,000 for that.',
      otherFunding: 'none',
      awardAddress: '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7',
    },
    {
      title: 'Another amazing proposal',
      summary: "You won't even believe it",
      tokensRequested: '300000000000000000000000',
      firstName: 'Sarah',
      lastName: 'Ethers',
      email: 'sarah@eth.io',
      github: 'sethers',
      website: 'se.io',
      projectPlan: '2019 is gonna be good',
      projectTimeline: '2020 is gonna be great',
      teamBackgrounds: 'I do this. He does that.',
      totalBudget: '$2,000,000 for this. $100,000 for that.',
      otherFunding: 'n/a',
      awardAddress: '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7',
    },
  ];

  // Automatically added fields
  const ipAddress = '1.2.3.4';

  return Promise.all(
    proposals.map(data => {
      const proposal = {
        ipAddress,
        ...data,
      };
      return Proposal.create(proposal).catch(error => {
        console.log(error);
      });
    })
  );
}

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

describe('POST /api/ballots', () => {
  let data, wallet;
  let route = '/api/ballots';

  beforeAll(() => {
    const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
    wallet = Wallet.fromMnemonic(mnemonic);
  });

  beforeEach(async () => {
    const salt = voting.randomSalt();
    const choices = {
      0: {
        firstChoice: '0',
        secondChoice: '1',
      },
      1: {
        firstChoice: '1',
        secondChoice: '2',
      },
    };
    // NOTE: this might be problematic for testing specific fields
    const commitHash = voting.generateCommitHash(choices, salt);
    const commitMessage = voting.generateCommitMessage(commitHash, choices['0'], salt);
    const signature = await wallet.signMessage(commitMessage);
    // Set up the ballot data
    data = {
      ballot: {
        epochNumber: '0',
        choices,
        salt: salt.toString(),
        voterAddress: wallet.address,
      },
      commitHash,
      signature,
    };
  });

  test('it should create a new ballot', async () => {
    const result = await request(app)
      .post('/api/ballots')
      .send(data);

    // console.log('RESULT', result.body);
    expect(result.status).toEqual(200);

    const created = result.body;
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    ['epochNumber', 'salt', 'signature'].forEach(property => {
      expect(created).toHaveProperty(property);
    });
  });

  test('it should return a 400 if the provided epochNumber && voterAddress already exist', async () => {
    await request(app)
      .post('/api/ballots')
      .send(data);

    const result = await request(app)
      .post('/api/ballots')
      .send(data);

    expect(result.status).toEqual(400);
  });

  test('it should return a 400 if no ballot data was provided', async () => {
    const result = await request(app).post('/api/ballots');

    expect(result.status).toEqual(400);
  });

  describe('missing required fields', () => {
    const requiredFields = ['ballot', 'signature', 'commitHash'];

    test.each(requiredFields)('it should return a 400 if `%s` is null', async field => {
      data[field] = null;
      const result = await request(app)
        .post('/api/ballots')
        .send(data);
      expect(result.status).toBe(400);
    });

    test.each(requiredFields)('it should return a 400 if `%s` is missing', async field => {
      data[field] = undefined;
      const result = await request(app)
        .post('/api/ballots')
        .send(data);
      expect(result.status).toBe(400);
    });

    // cannot be empty strings
    test.each(requiredFields)('it should return a 400 if `%s` is an empty string', async field => {
      data[field] = '';
      const result = await request(app)
        .post('/api/ballots')
        .send(data);
      expect(result.status).toBe(400);
    });

    // whitespace strings
    test.each(requiredFields)('it should return a 400 if `%s` is all whitespace', async field => {
      data[field] = '             ';
      const result = await request(app)
        .post('/api/ballots')
        .send(data);
      expect(result.status).toBe(400);
    });

    // `ballot` keys
    describe('ballot', () => {
      const ballotRequiredFields = ['epochNumber', 'salt', 'voterAddress', 'choices'];
      const ballotStringFields = ['epochNumber', 'salt', 'voterAddress'];

      test.each(ballotRequiredFields)('it should return a 400 if `%s` is null', async field => {
        data.ballot[field] = null;
        const result = await request(app)
          .post('/api/ballots')
          .send(data);
        // console.log(result);
        expect(result.status).toBe(400);
      });

      test.each(ballotRequiredFields)('it should return a 400 if `%s` is missing', async field => {
        data.ballot[field] = undefined;
        const result = await request(app)
          .post('/api/ballots')
          .send(data);
        expect(result.status).toBe(400);
      });

      // cannot be empty strings
      test.each(ballotStringFields)(
        'it should return a 400 if `%s` is an empty string',
        async field => {
          data.ballot[field] = '';
          const result = await request(app)
            .post('/api/ballots')
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      // whitespace strings
      test.each(ballotStringFields)(
        'it should return a 400 if `%s` is all whitespace',
        async field => {
          data.ballot[field] = '             ';
          const result = await request(app)
            .post('/api/ballots')
            .send(data);
          expect(result.status).toBe(400);
        }
      );
    });

    describe('ballot choices', () => {
      const choiceFields = ['firstChoice', 'secondChoice'];

      // missing
      test.each(choiceFields)(
        'it should return a 400 if any of the votes is missing a `%s`',
        async field => {
          data.ballot.choices[0][field] = undefined;
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      test.each(choiceFields)(
        'it should return a 400 if any of the votes has a null `%s`',
        async field => {
          data.ballot.choices[0][field] = null;
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      // not an integer
      test.each(choiceFields)(
        'it should return a 400 if any of the votes has a `%s` that does not parse as an integer',
        async field => {
          data.ballot.choices[0][field] = 'not a number';
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      test.each(choiceFields)(
        'it should return a 400 if any of the votes has a `%s` that parses as a float',
        async field => {
          data.ballot.choices[0][field] = 0.3;
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );
    });
  });

  describe('field validation', () => {
    test('it should return a 400 if the signature does not match the voterAddress', async () => {
      data.ballot.voterAddress = '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the salt is not numeric', async () => {
      data.ballot.salt = 'not a number';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the epochNumber is not numeric', async () => {
      data.ballot.epochNumber = 'not a number';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the epochNumber parses as a negative number', async () => {
      data.ballot.epochNumber = '-1';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the epochNumber does not parse as an integer', async () => {
      data.ballot.epochNumber = '0.5';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });

    test('it should return a 400 if the voterAddress is not a valid Ethereum address', async () => {
      data.ballot.voterAddress = '0';

      const result = await request(app)
        .post(route)
        .send(data);

      expect(result.status).toBe(400);
    });
  });
});

describe('POST /api/slates', () => {
  let data;
  let route = '/api/slates';

  beforeEach(() => {
    data = {
      slateID: 1,
      metadataHash: 'QmRZxt2b1FVZPNqd8hsiykDL3TdBDeTSPX9Kv46HmX4Gx1',
      email: 'jc@example.com',
    };

    // Allow us to use the same slateID each time
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
