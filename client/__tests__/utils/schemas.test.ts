import { GovernanceSlateFormSchema } from '../../utils/schemas';

const someAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function param(newValue) {
  return { newValue };
}

describe('Schemas', () => {
  describe('Governance slate form', () => {
    const base = {
      email: 'email@example.com',
      firstName: 'Jane',
      lastName: 'Crypto',
      summary: 'Good stuff',
    };

    const withParameters = {
      ...base,
      recommendation: 'governance',
      parameters: {},
    };

    const withNoAction = {
      ...base,
      recommendation: 'noAction',
      parameters: {},
    };

    describe('no action', () => {
      test('should allow empty an parameters object', async () => {
        const isValid = await GovernanceSlateFormSchema.isValid(withNoAction);
        expect(isValid).toBe(true);
      });

      // For now, allow a non-empty object, since we ignore it in processing the form
      test.skip('should reject a non-empty parameters object', async () => {
        const values = {
          ...withNoAction,
          parameters: {
            gatekeeperAddress: {
              newValue: someAddress,
            },
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });
    });

    describe('with parameters', () => {
      test('should reject an empty parameters object if adding proposals', async () => {
        const values = withParameters;
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });

      test('should accept valid parameter changes', async () => {
        const values = {
          ...withParameters,
          parameters: {
            gatekeeperAddress: param(someAddress),
            slateStakeAmount: param('40000'),
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(true);
      });

      test('should allow just a slateStakeAmount', async () => {
        const values = {
          ...withParameters,
          parameters: {
            gatekeeperAddress: param(''),
            slateStakeAmount: param('40000'),
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(true);
      });

      test('should allow just a gatekeeperAddress', async () => {
        const values = {
          ...withParameters,
          parameters: {
            gatekeeperAddress: param(someAddress),
            slateStakeAmount: param(''),
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(true);
      });

      test('should reject a slateStakeAmount that is not a valid token amount', async () => {
        const values = {
          ...withParameters,
          parameters: {
            slateStakeAmount: param('abc'),
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });

      test('should reject a gatekeeperAddress that is not an address', async () => {
        const values = {
          ...withParameters,
          parameters: {
            gatekeeperAddress: param('0xabc'),
          },
        };
        const isValid = await GovernanceSlateFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });
    });
  });
});
