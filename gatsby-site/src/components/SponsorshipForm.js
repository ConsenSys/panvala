import React from 'react';
import { Formik, Field } from 'formik';
import * as yup from 'yup';
import FieldText from './FieldText';
import Label from './Label';
import DonateButton from './DonateButton';
import DownArrow from './Form/DownArrow';
import { FormError } from './Form/FormError';

const SponsorFormSchema = yup.object({
  company: yup
    .string()
    .trim()
    .required('Please enter your company name'),
  firstName: yup.string().trim(),
  lastName: yup.string().trim(),
  email: yup
    .string()
    .trim()
    .email()
    .required('Please enter your email'),
  pledgeAmount: yup
    .number()
    .integer('Pledge must be an integer value')
    .moreThan(0, 'Please enter a valid pledge amount')
    .required('Please enter a pledge amount'),
  pledgeDuration: yup.number().moreThan(0, 'Please select a pledge duration'),
});

const SponsorshipForm = ({ onSubmit }) => {
  function handleDonate(values, actions) {
    // console.log('submit', values);

    // pass values to the callback
    onSubmit(values, actions);
    actions.setSubmitting(false);
  }

  return (
    <Formik
      initialValues={{
        company: '',
        firstName: '',
        lastName: '',
        email: '',
        pledgeAmount: '',
        pledgeDuration: 0,
      }}
      validationSchema={SponsorFormSchema}
      onSubmit={handleDonate}
    >
      {({ values, handleSubmit, handleChange, isSubmitting }) => (
        <form onSubmit={handleSubmit} className="w-80-l w-90-m w-100 center" name="sponsorship-pledge">
          <FieldText
            type="text"
            name="company"
            id="pledge-company"
            label="Company"
            placeholder="Enter the name of your company"
            value={values.company}
            required
          />

          <FieldText
            type="text"
            name="firstName"
            id="pledge-first-name"
            label="First Name"
            placeholder="Enter your first name"
            value={values.firstName}
          />

          <FieldText
            type="text"
            name="lastName"
            id="pledge-last-name"
            label="Last Name"
            placeholder="Enter your last name"
            value={values.lastName}
            onChange={handleChange}
          />

          <FieldText
            type="text"
            name="email"
            id="pledge-email"
            label="Email"
            placeholder="Enter your email address"
            value={values.email}
            onChange={handleChange}
            required
          />

          <FieldText
            type="number"
            name="pledgeAmount"
            id="pledge-amount"
            label="Monthly Pledge Amount (USD)"
            placeholder="Enter your pledge amount"
            required
            value={values.pledgeAmount}
            onChange={handleChange}
            min="0"
            step="1"
          />

          <Label required>How many months of your pledge will you prepay today?</Label>
          <FormError name="pledgeDuration" className="pt2" />
          <Field
            as="select"
            name="pledgeDuration"
            required
            className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2 bg-white black-50"
            id="pledge-duration-select"
            value={values.pledgeDuration}
            onChange={handleChange}
          >
            <option disabled="" defaultValue="0" value="0">
              Select the amount of months you would like to prepay for
            </option>
            <option value="1">1 month</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </Field>

          <DownArrow />

          <DonateButton text="Sponsor" disabled={isSubmitting} />
        </form>
      )}
    </Formik>
  );
};

export default SponsorshipForm;
