import React, { useState } from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import FieldText from '../FieldText';
import Label from '../Label';
import DonateButton from '../DonateButton';
import DownArrow from '../Form/DownArrow';
import { FormError } from '../Form/FormError';
import Box from '../system/Box';
import PledgeAmount from './PledgeAmount';
import Input from '../Input';

const FundraiserFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('Please enter your first name'),
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
    .required('Please choose a donation amount'),
  message: yup.string().trim(),
});

export const FundraiserForm = ({ onSubmit }) => {
  function handleDonate(values, actions) {
    // console.log('submit', values);

    // pass values to the callback
    onSubmit(values, actions);
    actions.setSubmitting(false);
  }

  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        pledgeAmount: '',
        message: '',
      }}
      validationSchema={FundraiserFormSchema}
      onSubmit={handleDonate}
    >
      {({ values, handleSubmit, handleChange, isSubmitting, setFieldValue }) => (
        <form
          onSubmit={handleSubmit}
          className="w-50-l w-70-m w-80 center pb6"
          name="fundraisership-pledge"
        >
          <Label required={true}>Choose a Donation Amount</Label>
          <div className="red tl pt2">
            <ErrorMessage name="pledgeAmount" component="span" />
          </div>
          <Box flex justifyContent={['space-around', 'space-between']} wrap>
            {['10', '25', '50', '100'].map((amount, i) => (
              <PledgeAmount
                key={i}
                text={`$${amount}/mo`}
                handleClick={e => {
                  e.preventDefault();
                  setFieldValue('pledgeAmount', amount);
                }}
                active={values.pledgeAmount === amount}
                mb={['1rem', '0']}
              />
            ))}
          </Box>
          <Input
            type="number"
            name="pledgeAmount"
            id="pledge-amount"
            label="Choose a Donation Amount"
            placeholder="$ USD"
            required
            value={values.pledgeAmount}
            onChange={() => null}
            mt={3}
            bg="greys.veryLight"
          />

          <FieldText
            type="text"
            name="firstName"
            id="pledge-first-name"
            label="First Name"
            placeholder="Enter your first name"
            value={values.firstName}
            onChange={handleChange}
            required
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
            type="textarea"
            component="textarea"
            name="message"
            id="pledge-message"
            label="Message"
            placeholder="Leave a comment"
            value={values.message}
            onChange={handleChange}
            rows={6}
          />

          <Box flex justifyContent="center">
            <DonateButton text="Donate now" disabled={isSubmitting} />
          </Box>
        </form>
      )}
    </Formik>
  );
};
