import * as request from 'supertest';
import app from '../index';

describe.skip('Epochs', () => {
  describe('GET /api/epochs/:epochNumber/dates', () => {
    const baseRoute = '/api/epochs';
    let epoch: string = 'current';
    let route: string = `${baseRoute}/${epoch}/dates`;

    beforeEach(async () => {});

    it('should return an object with the current epoch details', async () => {
      const result = await request(app).get(route);

      expect(result.ok).toBe(true);

      const epochDates = result.body;
      const {
        epochNumber,
        epochStart,
        proposalSubmissionOpens,
        proposalSubmissionCloses,
        slateCreationOpens,
        slateCreationCloses,
        votingOpens,
        votingCloses,
        votingConcludes,
      } = epochDates;

      expect(epochNumber).not.toBe(epoch);
      expect(typeof epochNumber).toBe('number');
      expect(typeof epochStart).toBe('number');
      expect(typeof proposalSubmissionOpens).toBe('number');
      expect(typeof proposalSubmissionCloses).toBe('number');
      expect(typeof slateCreationOpens).toBe('number');
      expect(typeof slateCreationCloses).toBe('number');
      expect(typeof votingOpens).toBe('number');
      expect(typeof votingCloses).toBe('number');
      expect(typeof votingConcludes).toBe('number');
    });

    it('should return with an error if epochNumber is invalid', async () => {
      epoch = '-23';
      route = `${baseRoute}/${epoch}/dates`;
      const res1 = await request(app).get(route);
      expect(res1.ok).toBe(false);

      epoch = '4231342';
      route = `${baseRoute}/${epoch}/dates`;
      const res2 = await request(app).get(route);
      expect(res2.ok).toBe(false);

      epoch = 'blah blah blah';
      route = `${baseRoute}/${epoch}/dates`;
      const res3 = await request(app).get(route);
      expect(res3.ok).toBe(false);
      expect(res3.body.msg).toBeTruthy();
      expect(res3.body.errors).toHaveLength(1);
    });
  });
});

// test utilities
describe.skip('epoch utilities', () => {
  it.todo('test dates');
});
