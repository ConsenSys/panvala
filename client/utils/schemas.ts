import * as yup from 'yup';
import { isAddress } from './format';

// Hex string with 40 characters
export const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

// Number with no more than 18 decimal places
export const panValueRegex = /^[0-9]+\.?[0-9]{0,18}$/;

export const MAX_TEXT_FIELD_LENGTH = 2000; // text
export const MAX_STRING_FIELD_LENGTH = 255; // varchar 255

export const PanValueSchema = yup.string().matches(panValueRegex);
export const EthereumAddressSchema = yup.string().matches(ethereumAddressRegex);

const ethereumAddressTest = {
  name: 'valid-eth-address',
  message: 'Invalid Ethereum address',
  test: value => {
    if (typeof value !== 'string') return false;

    if (value.trim().length > 0) {
      return isAddress(value.toLowerCase());
    }
    return true;
  },
};

// Schemas
export const ParametersObjectSchema = yup
  .object()
  .test({
    name: 'has-param',
    message: 'Must set at least one parameter',
    test: value => {
      let valid = false;
      Object.keys(value).forEach(key => {
        const { newValue } = value[key];
        if (typeof newValue !== 'undefined') {
          valid = true;
        }
      });
      return valid;
    },
  })
  .shape({
    // can be empty strings
    gatekeeperAddress: yup.object().shape({
      newValue: yup.string().test(ethereumAddressTest),
    }),
    slateStakeAmount: yup.object().shape({
      newValue: yup.string().matches(panValueRegex, {
        message: 'Must be a valid token amount',
        excludeEmptyString: true,
      }),
    }),
  });

export const EmptyParametersObjectSchema = yup.object().test({
  name: 'empty-parameters',
  message: 'Must be empty',
  test: value => {
    let valid = true;
    Object.keys(value).forEach(key => {
      const { newValue } = value[key];
      if (typeof newValue !== 'undefined' && newValue !== '') {
        valid = false;
      }
    });
    return valid;
  },
});

export const GovernanceSlateFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Required'),
  firstName: yup.string().required('Required'),
  summary: yup
    .string()
    .max(5000, 'Too Long!')
    .required('Required'),
  recommendation: yup
    .string()
    .oneOf(['noAction', 'governance'])
    .required('Required'),
  // parameters cannot be empty when recommendation is "governance"
  // otherwise, let any object through, because it gets ignored in the form processing
  parameters: yup.object().when('recommendation', {
    is: val => val === 'governance',
    then: ParametersObjectSchema,
    otherwise: yup.object(),
  }),
});

export const GrantProposalFormSchema = yup.object().shape({
  firstName: yup
    .string()
    .trim()
    .min(2, 'Too short!')
    .max(70, 'Too long!')
    .required('Required'),
  lastName: yup
    .string()
    .trim()
    .min(2, 'Too short!')
    .max(70, 'Too long!'),
  email: yup
    .string()
    .max(MAX_STRING_FIELD_LENGTH, 'Too long!')
    .email('Invalid email')
    .required('Required'),
  github: yup.string().max(MAX_STRING_FIELD_LENGTH, 'Too long!'),
  title: yup
    .string()
    .trim()
    .max(70, 'Too long!')
    .required('Required'),
  website: yup.string().max(MAX_STRING_FIELD_LENGTH, 'Too long!'),
  summary: yup
    .string()
    .trim()
    .max(4000, 'Too long!')
    .required('Required'),
  projectTimeline: yup.string().max(MAX_TEXT_FIELD_LENGTH, 'Too long!'),
  teamBackgrounds: yup.string().max(MAX_TEXT_FIELD_LENGTH, 'Too long!'),
  projectPlan: yup.string().max(MAX_TEXT_FIELD_LENGTH, 'Too long!'), // no longer in form
  tokensRequested: yup
    .string()
    .matches(panValueRegex, 'Must be a number with no more than 18 decimals')
    .test({
      name: 'non-zero-tokens',
      message: 'Cannot request zero tokens',
      test: value => value !== '0',
    })
    .required('Required'),
  totalBudget: yup.string().max(MAX_STRING_FIELD_LENGTH, 'Too long!'),
  otherFunding: yup.string().max(MAX_STRING_FIELD_LENGTH, 'Too long!'),
  awardAddress: yup
    .string()
    .trim()
    .required('Required')
    .test(ethereumAddressTest),
});
