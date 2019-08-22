import { convertEVMSlateStatus, slateSubmissionDeadline } from '../../utils/status';

describe('Status', () => {
  test('should return the correct status for each EVM slate status', () => {
    const unstaked = convertEVMSlateStatus(0);
    expect(unstaked).toBe('PENDING TOKENS');
    const staked = convertEVMSlateStatus(1);
    expect(staked).toBe('PENDING VOTE');
    const rejected = convertEVMSlateStatus(2);
    expect(rejected).toBe('ACCEPTED');
    const accepted = convertEVMSlateStatus(3);
    expect(accepted).toBe('REJECTED');
  });

  test('should throw an error if given an invalid status', () => {
    const invalid = convertEVMSlateStatus(7483921);
    expect(invalid).toBe(undefined);
  });

  describe('slate submission', () => {
    const oneWeekSeconds: number = 604800;
    const epochStart = 1549040400; // 2/1
    const votingOpen = epochStart + oneWeekSeconds * 11;

    test('should calculate the slate submission deadline', () => {
      const deadline = slateSubmissionDeadline(votingOpen, epochStart);
      const dt = new Date(deadline * 1000);

      // expect 2019-03-12 00:00
      expect(dt.getFullYear()).toBe(2019);
      expect(dt.getMonth()).toBe(2); // March = 2
      expect(dt.getDate()).toBe(12);
    });

    test('staked 1 week in', () => {
      // stake 1 week in
      const lastStaked = epochStart + oneWeekSeconds;
      const deadline = slateSubmissionDeadline(votingOpen, lastStaked);
      const dt = new Date(deadline * 1000);

      // expect 6 weeks in
      // expect 2019-03-15 12:00
      expect(dt.getFullYear()).toBe(2019);
      expect(dt.getMonth()).toBe(2); // March = 2
      expect(dt.getDate()).toBe(15);
    });

    test('staked 5 weeks in', () => {
      const lastStaked = epochStart + oneWeekSeconds * 5;
      const deadline = slateSubmissionDeadline(votingOpen, lastStaked);
      const dt = new Date(deadline * 1000);

      // expect 8 weeks in
      // expect 2019-03-29 12:00
      expect(dt.getFullYear()).toBe(2019);
      expect(dt.getMonth()).toBe(2); // March = 2
      expect(dt.getDate()).toBe(29);
    });
  });
});
