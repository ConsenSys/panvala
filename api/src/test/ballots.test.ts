import * as request from 'supertest';
import app from '../index';
import { Wallet } from 'ethers';
import { voting } from '../utils';
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

describe('POST /api/ballots', () => {
  let data, wallet;
  let route = '/api/ballots';
  const grantResource = '0xEe6069F52bC7111c218280a232671a627b1d3e1b';
  const governanceResource = '0xC42F9084ee2C6a2295226cAf86111Ce71DFFC139';

  beforeAll(() => {
    const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
    wallet = Wallet.fromMnemonic(mnemonic);
  });

  beforeEach(async () => {
    const salt = voting.randomSalt();
    const choices = {
      [grantResource]: {
        firstChoice: '0',
        secondChoice: '1',
      },
      [governanceResource]: {
        firstChoice: '2',
        secondChoice: '3',
      },
    };
    // NOTE: this might be problematic for testing specific fields
    const commitHash = voting.generateCommitHash(choices, salt);
    const commitMessage = voting.generateCommitMessage(commitHash, choices, salt);
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

    console.log('RESULT', result.body);
    expect(result.status).toEqual(200);

    const created = result.body;
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    ['epochNumber', 'salt', 'signature'].forEach(property => {
      expect(created).toHaveProperty(property);
    });

    // Each VoteChoice should have the given fields
    const voteFields = ['firstChoice', 'secondChoice', 'resource'];
    created.choices.forEach(choice => {
      console.log('choice', choice);
      voteFields.forEach(property => {
        expect(choice).toHaveProperty(property);
      });
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
      const choiceFields = ['firstChoice', 'secondChoice', 'resource'];
      const choiceNumberFields = ['firstChoice', 'secondChoice'];

      test('it should reject choices not keyed by address', async () => {
        const grantChoice = data.ballot.choices[grantResource];
        data.ballot.choices[0] = grantChoice;

        const result = await request(app)
          .post(route)
          .send(data);
        expect(result.status).toBe(400);
      });

      // missing
      test.each(choiceFields)(
        'it should return a 400 if any of the votes is missing a `%s`',
        async field => {
          data.ballot.choices[grantResource][field] = undefined;
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      test.each(choiceFields)(
        'it should return a 400 if any of the votes has a null `%s`',
        async field => {
          data.ballot.choices[grantResource][field] = null;
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      // not an integer
      test.each(choiceNumberFields)(
        'it should return a 400 if any of the votes has a `%s` that does not parse as an integer',
        async field => {
          data.ballot.choices[grantResource][field] = 'not a number';
          const result = await request(app)
            .post(route)
            .send(data);
          expect(result.status).toBe(400);
        }
      );

      test.each(choiceNumberFields)(
        'it should return a 400 if any of the votes has a `%s` that parses as a float',
        async field => {
          data.ballot.choices[grantResource][field] = 0.3;
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
