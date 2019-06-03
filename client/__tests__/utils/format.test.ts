import { splitAddressHumanReadable, convertedToBaseUnits } from '../../utils/format';

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
      const invalidAddress = '0xd115bffabbdd893a6f7cea402e7338';
      const formatted = splitAddressHumanReadable(invalidAddress);
      const expected = 'invalid address';
      expect(formatted).toBe(expected);
    });

    test('should fail gracefully if provided an invalid address (non-hex)', () => {
      // non-hex chars
      const invalidAddress = '0x784fefd70429256nefd79fn4256n784fefd7256n';
      const formatted = splitAddressHumanReadable(invalidAddress);
      const expected = 'invalid address';
      expect(formatted).toBe(expected);
    });
  });

  describe('convertedToBaseUnits', () => {
    test('should convert integers correctly', () => {
      const base1 = convertedToBaseUnits('100', 18);
      expect(base1).toBe('100000000000000000000');

      const base2 = convertedToBaseUnits('9534782954988543', 18);
      expect(base2).toBe('9534782954988543000000000000000000');
    });

    test('should convert decimals correctly', () => {
      const base1 = convertedToBaseUnits('100.0', 18);
      expect(base1).toBe('100000000000000000000');

      const base2 = convertedToBaseUnits('9534782954988543.1', 18);
      expect(base2).toBe('9534782954988543100000000000000000');

      const base3 = convertedToBaseUnits('12345.87459321', 18);
      expect(base3).toBe('12345874593210000000000');
    });

    test('should throw if given an invalid string value', () => {
      try {
        convertedToBaseUnits('invalid number string', 18);
      } catch (error) {
        expect(error.message).toContain('invalid decimal value');
        return;
      }
      fail('should have throw if given invalid value');
    });

    test('should throw if given a value with more than 18 decimals', () => {
      try {
        convertedToBaseUnits('100.1234567890123456789', 18);
      } catch (error) {
        expect(error.message).toContain('underflow occurred');
        return;
      }
      fail('should have throw if given value with more than 18 decimals');
    });
  });
});
