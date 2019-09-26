import {
  GovernanceSlateFormSchema,
  GrantProposalFormSchema,
  MAX_STRING_FIELD_LENGTH,
  MAX_TEXT_FIELD_LENGTH,
} from '../../utils/schemas';

const someAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function clone(obj) {
  return Object.assign({}, obj);
}

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

  describe('Grant proposal form', () => {
    const data = {
      firstName: 'Jenny',
      lastName: 'Crypto',
      email: 'jcrypto@example.com',
      title: 'Great project',
      summary: 'Really good stuff',
      tokensRequested: '1000',
      awardAddress: someAddress,
    };

    const requiredFields = [
      'firstName',
      'email',
      'title',
      'summary',
      'tokensRequested',
      'awardAddress',
    ];

    test('should accept the form values', async () => {
      const values = clone(data);
      const isValid = await GrantProposalFormSchema.isValid(values);
      expect(isValid).toBe(true);
    });

    describe('required fields', () => {
      test.each(requiredFields)('should reject if `%s` is empty', async field => {
        const values = clone(data);
        values[field] = '';
        const isValid = await GrantProposalFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });

      test.each(requiredFields)('should reject if `%s` is all whitespace', async field => {
        const values = clone(data);
        values[field] = '   ';
        const isValid = await GrantProposalFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });
    });

    describe('string field lengths', () => {
      const fieldLengths = [
        ['firstName', 70],
        ['lastName', 70],
        ['email', MAX_STRING_FIELD_LENGTH],
        ['github', MAX_STRING_FIELD_LENGTH],
        ['title', 70],
        ['website', MAX_STRING_FIELD_LENGTH],
        ['summary', 4000],
        ['projectTimeline', MAX_TEXT_FIELD_LENGTH],
        ['teamBackgrounds', MAX_TEXT_FIELD_LENGTH],
        ['projectPlan', MAX_TEXT_FIELD_LENGTH],
        ['totalBudget', MAX_STRING_FIELD_LENGTH],
        ['otherFunding', MAX_STRING_FIELD_LENGTH],
      ];

      test.each(fieldLengths)('should reject `%s` greater than %s characters', async (field, length) => {
        const values = clone(data);
        values[field] = 'a'.repeat(length + 1);
        // console.log(values);

        await expect(GrantProposalFormSchema.validate(values)).rejects.toThrowError(
          'Too long!'
        );
        const isValid = await GrantProposalFormSchema.isValid(values);
        expect(isValid).toBe(false);
      });
    });

    // Bad data
    test('should reject if zero tokens are requested', async () => {
      const values = {
        ...data,
        tokensRequested: '0',
      };
      const isValid = await GrantProposalFormSchema.isValid(values);
      expect(isValid).toBe(false);
    });

    test('should reject an invalid awardAddress', async () => {
      const values = {
        ...data,
        awardAddress: 'abc',
      };
      const isValid = await GrantProposalFormSchema.isValid(values);
      expect(isValid).toBe(false);
    });
  });
});
