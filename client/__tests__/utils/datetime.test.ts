import { tsToDeadline } from '../../utils/datetime';

describe('Datetime', () => {
  test('should return the correct datetime string when provided a unix block.timestamp', () => {
    const ts = 1539044131;
    const deadline = tsToDeadline(ts, 'America/New_York');
    expect(deadline).toBe('2018-10-08 AT 20:15 PM');
  });

  test('should return with error message when given an invalid timestamp', () => {
    const ts = 75892317423891472389;
    const deadline = tsToDeadline(ts, 'America/New_York');
    expect(deadline).toBe('Invalid date');
  });
});
