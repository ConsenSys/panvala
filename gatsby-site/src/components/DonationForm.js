import React from 'react';
import { Formik, Field } from 'formik';
import * as yup from 'yup';

import DonateButton from './DonateButton';
import FieldText from './FieldText';
import Label from './Label';
import DownArrow from './Form/DownArrow';
import { FormError } from './Form/FormError';

const DonationFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('Please enter your first name'),
  lastName: yup.string().trim(),
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address')
    .required('Please enter your email'),
  monthlyPledge: yup
    .number()
    .integer()
    .moreThan(0, 'Please select a pledge tier'),
  pledgeDuration: yup.number().moreThan(0, 'Please select a pledge duration'),
});

const DonationForm = ({ onSubmit, ethPrices }) => {
  function handleDonate(values, actions) {
    // console.log('DonationForm:', 'submit', values);

    onSubmit(values, actions);
    actions.setSubmitting(false);
  }

  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        monthlyPledge: 0,
        pledgeDuration: 0,
      }}
      validationSchema={DonationFormSchema}
      onSubmit={handleDonate}
    >
      {({ values, handleSubmit, handleChange, isSubmitting }) => (
        <form onSubmit={handleSubmit} className="w-80-l w-90-m w-100 center" name="donation-pledge">
          <FieldText
            type="text"
            name="firstName"
            id="pledge-first-name"
            label="First Name"
            required
            placeholder="Enter your first name"
            value={values.firstName}
            onChange={handleChange}
            className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
          />

          <FieldText
            type="text"
            name="lastName"
            id="pledge-last-name"
            label="Last Name"
            placeholder="Enter your last name"
            value={values.lastName}
            onChange={handleChange}
            className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
          />

          <FieldText
            type="text"
            name="email"
            id="pledge-email"
            label="Email"
            required
            placeholder="Enter your email address"
            value={values.email}
            onChange={handleChange}
            className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
          />

          <Label required>Pledge Tier</Label>
          <FormError name="monthlyPledge" className="pt2" />
          <Field
            as="select"
            name="monthlyPledge"
            required
            className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2 bg-white black-50"
            value={values.monthlyPledge}
            onChange={handleChange}
            id="pledge-tier-select"
          >
            <option disabled="" defaultValue="0" value="0">
              Select your pledge tier
            </option>
            <option value="5">{`Student — $5/month (${ethPrices.student} ETH)`}</option>
            <option value="15">{`Gold — $15/month (${ethPrices.gold} ETH)`}</option>
            <option value="50">{`Platinum — $50/month (${ethPrices.platinum} ETH)`}</option>
            <option value="150">{`Diamond — $150/month (${ethPrices.diamond} ETH)`}</option>
            <option value="500">{`Ether Advisor — $500/month (${ethPrices.ether} ETH)`}</option>
            <option value="1500">{`Elite Advisor — $1500/month (${ethPrices.elite} ETH)`}</option>
          </Field>
          <DownArrow />

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

          <DonateButton disabled={isSubmitting} />
        </form>
      )}
    </Formik>
  );
};

export default DonationForm;
