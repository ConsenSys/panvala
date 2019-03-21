import { randomSalt } from '../../utils/voting';


describe('Voting', () => {
  test('should create a random salt', () => {
    const salt = randomSalt();

    // length = 2 * 32 bytes + `0x`
    expect(salt.toHexString().length).toEqual(66);
  });
});
