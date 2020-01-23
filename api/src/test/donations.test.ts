import * as request from 'supertest';
import { bigNumberify, hashMessage } from 'ethers/utils';

import app from '..';
import { migrate } from '../migrate';
import { sequelize } from '../models';
import {
  IDonation,
  addDonation,
  getPublicDonations,
  IPublicDonation,
  getDonationsForFundraiser,
  calculateStats,
  getQuarterlyDonationStats,
} from '../utils/donations';
import {
  someTxHash,
  someCID,
  someAddress,
  expectFields,
  toBaseTokens,
  expectFieldsWithTypes,
  testFundraiserDonations,
} from './utils';

const { Donation } = require('../models');

beforeAll(() => {
  sequelize.options.logging = false;
  return migrate();
});

afterAll(() => {
  const q = sequelize.getQueryInterface();
  return q.dropAllTables().then(() => sequelize.close());
});

beforeEach(async () => {
  return Donation.truncate();
});

const requiredFields = ['txHash', 'metadataHash', 'sender', 'donor', 'tokens'];

describe('API endpoints', () => {
  const route = '/api/donations';

  describe('POST /api/donations', () => {
    test('it should create a new basic donation', async () => {
      const data: IDonation = {
        txHash: someTxHash,
        metadataHash: someCID,
        sender: someAddress,
        donor: someAddress,
        tokens: bigNumberify(1000).toString(),
      };
      const result = await request(app)
        .post(route)
        .send(data);

      // console.log('RESULT', result.body);
      expect(result.ok).toBe(true);

      const created = result.body;
      expect(created).toHaveProperty('createdAt');
      expect(created).toHaveProperty('updatedAt');

      expectFields(created, data);
    });

    test('it should create a donation with all the fields', async () => {
      const data: IDonation = {
        txHash: someTxHash,
        metadataHash: someCID,
        sender: someAddress,
        donor: someAddress,
        tokens: toBaseTokens(1000),
        metadataVersion: '1',
        memo: 'A donation',
        usdValueCents: '4500',
        ethValue: toBaseTokens(1.337),
        pledgeMonthlyUSDCents: 1500,
        pledgeTerm: 3,
        fundraiser: 'fundraiser',
        message: 'Good cause',
      };

      const result = await request(app)
        .post(route)
        .send(data);

      // console.log('RESULT', result.body);
      expect(result.ok).toBe(true);

      const created = result.body;
      expectFieldsWithTypes(created, data);
    });

    describe('Field validation', () => {
      let data: IDonation;
      beforeEach(() => {
        data = {
          txHash: someTxHash,
          metadataHash: someCID,
          sender: someAddress,
          donor: someAddress,
          tokens: bigNumberify(1000).toString(),
        };
      });

      describe('missing required fields', () => {
        test.each(requiredFields)('it should fail if %s is null', async field => {
          data[field] = null;

          const result = await request(app)
            .post(route)
            .send(data);

          expect(result.status).toBe(400);
        });

        test.each(requiredFields)('it should fail if %s is undefined', async field => {
          data[field] = undefined;

          const result = await request(app)
            .post(route)
            .send(data);

          expect(result.status).toBe(400);
        });

        test.each(requiredFields)('it should fail if %s is empty', async field => {
          data[field] = '';

          const result = await request(app)
            .post(route)
            .send(data);

          expect(result.status).toBe(400);
        });
      });

      // values that must be non-zero integers
      const integerFields = ['pledgeMonthlyUSDCents', 'pledgeTerm'];
      test.each(integerFields)('it should return 400 if %s is not an integer', async field => {
        data[field] = 10.5;

        const result = await request(app)
          .post(route)
          .send(data);

        expect(result.status).toBe(400);
      });

      test.each(integerFields)('is should return 400 if %s is less than 1', async field => {
        data[field] = 0.9;

        const result = await request(app)
          .post(route)
          .send(data);

        // console.log('RESULT', result.body);
        expect(result.status).toBe(400);
      });

      // values that must be in dollars
      const dollarFields = ['usdValueCents', 'pledgeMonthlyUSDCents'];
      test.each(dollarFields)('it should return 400 if %s is less than a dollar', async field => {
        data[field] = 99;
        const result = await request(app)
          .post(route)
          .send(data);

        // console.log('RESULT', result.body);
        expect(result.status).toBe(400);
      });

      test.each(dollarFields)('it should return 400 if %s is not an integer', async field => {
        data[field] = 1.0;
        const result = await request(app)
          .post(route)
          .send(data);

        expect(result.status).toBe(400);
      });

      const tokenFields = ['tokens', 'ethValue'];
      test.each(tokenFields)(
        'it should return 400 if %s does not parse to an integer (bigNumber)',
        async field => {
          data[field] = '1.0';

          const result = await request(app)
            .post(route)
            .send(data);

          console.log('RESULT', result.body);
          expect(result.status).toBe(400);
        }
      );

      // reject invalid emails
      test('it should return 400 if the email is invalid', async () => {
        data.email = 'notanemail';

        const result = await request(app)
          .post(route)
          .send(data);

        expect(result.status).toBe(400);
      });
    });
  });

  describe('GET /api/donations', () => {
    let data: IDonation;

    beforeEach(() => {
      data = {
        txHash: someTxHash,
        metadataHash: someCID,
        sender: someAddress,
        donor: someAddress,
        tokens: toBaseTokens(1000),
        metadataVersion: '1',
        memo: 'A donation',
        usdValueCents: '4500',
        ethValue: toBaseTokens(1.337),
        pledgeMonthlyUSDCents: 1500,
        pledgeTerm: 3,
        firstName: 'Jane',
        lastName: 'Crypto',
        email: 'jane@example.com',
        company: 'Example Company',
      };
    });

    test('it should retrieve donations', async () => {
      // Add a couple donations
      const d2 = {
        ...data,
        txHash: hashMessage('d2'),
        firstName: 'John',
        lastName: 'Ether',
        email: 'john@example.com',
      };
      await addDonation(data);
      await addDonation(d2);

      // Retrieve them
      const result = await request(app).get(route);

      expect(result.ok).toBe(true);
      expect(result.body).toHaveLength(2);
    });

    test('it should return an empty list if there are no donations', async () => {
      const result = await request(app).get(route);

      expect(result.ok).toBe(true);
      expect(result.body).toHaveLength(0);
    });
  });

  describe('GET /api/fundraisers/:fundraiser/donations', () => {
    const fundraiser1 = 'fundraiser-1';
    const fundraiser2 = 'fundraiser-2';

    const route = '/api/fundraisers';
    let data: IDonation;

    beforeEach(() => {
      data = {
        txHash: someTxHash,
        metadataHash: someCID,
        sender: someAddress,
        donor: someAddress,
        tokens: toBaseTokens(1000),
        metadataVersion: '1',
        memo: 'A donation',
        usdValueCents: '4500',
        ethValue: toBaseTokens(1.337),
        pledgeMonthlyUSDCents: 1500,
        pledgeTerm: 3,
        firstName: 'Jane',
        lastName: 'Crypto',
        email: 'jane@example.com',
        company: 'Example Company',
        fundraiser: fundraiser1,
      };
    });

    test('it should return donations for a given fundraiser', async () => {
      // Add a couple donations
      const d2: IDonation = {
        ...data,
        txHash: hashMessage('d2'),
        firstName: 'John',
        lastName: 'Ether',
        email: 'john@example.com',
        fundraiser: fundraiser2,
      };
      await addDonation(data);
      await addDonation(d2);

      // Retrieve for fundraiser 1
      const result = await request(app).get(`${route}/${fundraiser1}/donations`);

      expect(result.ok).toBe(true);
      expect(result.body).toHaveLength(1);

      // Retrieve for fundraiser 2
      const result2 = await request(app).get(`${route}/${fundraiser2}/donations`);

      expect(result2.ok).toBe(true);
      expect(result2.body).toHaveLength(1);
    });

    test('it should return an empty list if there are no donations', async () => {
      const result = await request(app).get(`${route}/${fundraiser1}/donations`);

      expect(result.ok).toBe(true);
      expect(result.body).toHaveLength(0);
    });
  });

  describe('GET /api/fundraisers/:fundraiser/donations/quarterly', () => {
    const fundraiser = 'fundraiser-1';

    beforeEach(async () => {
      const donations = testFundraiserDonations;

      // add all donations
      await Promise.all(donations.map(d => addDonation(d)));
    });

    test('it should retrieve donation stats for a fundraiser', async () => {
      const route = `/api/fundraisers/${fundraiser}/donations/quarter`;

      const result = await request(app).get(route);
      expect(result.ok).toBe(true);

      const stats = result.body;
      console.log(stats);
      // repeated donors: Anonymous and David West
      expect(Object.keys(stats.donors)).toHaveLength(5);
    })
  });
});

describe('donation utilities', () => {
  const txHash = hashMessage('donate');
  let data: IDonation;

  beforeEach(() => {
    data = {
      txHash,
      metadataHash: someCID,
      sender: someAddress,
      donor: someAddress,
      tokens: '0x',
    };
  });

  test('it should create a new donation', async () => {
    const donation = await addDonation(data);
    expectFields(donation, data);
    // console.log(donation);
  });

  test('it should get public donation information', async () => {
    await addDonation(data);

    const donations: IPublicDonation[] = await getPublicDonations();
    expect(donations.length).toBe(1);

    // Skip user fields
    const userFields = ['firstName', 'lastName', 'email', 'company'];
    userFields.forEach(field => {
      expect(data[field]).toBeUndefined();
    });
  });

  test('it should get donations for a fundraiser', async () => {
    const fundraiser = 'fundraiser-1';
    const fundraiser2 = 'fundraiser-2';
    data.fundraiser = fundraiser;

    // add two with a fundraiser
    await addDonation(data);
    await addDonation(data);
    // add another one
    await addDonation({ ...data, fundraiser: fundraiser2 });

    // Expect only the two
    const donations: IPublicDonation[] = await getDonationsForFundraiser(fundraiser);
    expect(donations).toHaveLength(2);

    const donations2: IPublicDonation[] = await getDonationsForFundraiser(fundraiser2);
    expect(donations2).toHaveLength(1);
  });

  describe('donation stats', () => {
    const fundraiser = 'fundraiser-1';
    const donations: IDonation[] = testFundraiserDonations;

    const sumCents = (values: IDonation[]) => {
      return values.reduce((prev, current) => {
        return prev + parseInt(current.usdValueCents);
      }, 0);
    };

    test('it should calculate stats for donations', async () => {
      const stats = calculateStats(donations);
      // console.log(JSON.stringify(stats));

      const expectedTotal: number = sumCents(donations);
      expect(stats.totalUsdCents).toBe(expectedTotal);

      // repeated entries should be handled
      expect(stats.donors['Anonymous']).toHaveLength(2);
      expect(stats.donors['David West']).toHaveLength(2);
    });

    test('stats should be empty if there are no donations', async () => {
      const stats = calculateStats([]);
      const expectedTotal = 0;
      expect(stats.totalUsdCents).toBe(expectedTotal);
      expect(Object.keys(stats.donors)).toHaveLength(0);
    })

    test('it should get donations for a fundraiser for the current quarter', async () => {
      // donations for our fundraiser
      await Promise.all(donations.map(d => addDonation(d)));

      // get the data back
      const stats = await getQuarterlyDonationStats(fundraiser);
      // console.log('quarterly', JSON.stringify(stats));

      const expectedTotal: number = sumCents(donations);
      expect(stats.totalUsdCents).toBe(expectedTotal);

      // repeated entries should be handled
      expect(stats.donors['Anonymous']).toHaveLength(2);
      expect(stats.donors['David West']).toHaveLength(2);
    });
  });

  describe('missing required fields', () => {
    const requiredFields = ['txHash', 'metadataHash', 'sender', 'donor', 'tokens'];
    test.each(requiredFields)('it should fail if %s is null', async field => {
      data[field] = null;

      await expect(addDonation(data)).rejects.toThrow();
    });
  });
});
