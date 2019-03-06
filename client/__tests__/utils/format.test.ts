import { splitAddressHumanReadable } from '../../utils/format';

describe('Formatters', () => {
  describe('splitAddressHumanReadable', () => {
    test('should split an address correctly', () => {
      const address = '0xd115bffabbdd893a6f7cea402e7338643ced44a6';
      const formatted = splitAddressHumanReadable(address);
      const expected = '0x D115 BFFA BBDD 893A 6F7C EA40 2E73 3864 3CED 44A6';
      expect(formatted).toBe(expected);
    });

    test('should fail gracefully if provided an invalid address (not-enough-chars)', () => {
      // not enough chars
      const invalidAddress1 = '0xd115bffabbdd893a6f7cea402e7338';
      try {
        splitAddressHumanReadable(invalidAddress1);
      } catch (error) {
        expect(error.message).toContain('invalid address');
        return;
      }
      fail('should have failed when given an invalid address without enough characters');
    });

    test('should fail gracefully if provided an invalid address (non-hex)', () => {
      // non-hex chars
      const invalidAddress2 = '0x784fefd70429256nefd79fn4256n784fefd7256n';
      try {
        splitAddressHumanReadable(invalidAddress2);
      } catch (error) {
        expect(error.message).toContain('invalid address');
        return;
      }
      fail('should have failed when given an invalid hex address');
    });
  });
});
