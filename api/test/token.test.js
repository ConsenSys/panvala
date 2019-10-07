const request = require('supertest');
const app = require('../index');

describe('circulatingSupply', () => {
  const route = '/api/token/circulating-supply';

  // SKIP - we can't actually run this without an Ethereum provider
  test.skip('it should calculate the circulating supply', async () => {
    const totalSupply = 100000000;

    const result = await request(app).get(route);
    expect(result.status).toBe(200);
  });
});
