import * as yup from 'yup';

export const GovernanceSlateFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Required'),
  title: yup
    .string()
    .max(80, 'Too Long!')
    .required('Required'),
  firstName: yup.string().required('Required'),
  summary: yup
    .string()
    .max(5000, 'Too Long!')
    .required('Required'),
  recommendation: yup.string().required('Required'),
  parameters: yup.object().required('Required'),
});
