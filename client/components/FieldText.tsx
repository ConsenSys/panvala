import * as React from 'react';
import styled from 'styled-components';
import { Field as FormikField } from 'formik';
import { COLORS } from '../styles';
import Label from './Label';
import { ErrorMessage } from './FormError';

export const Field = styled(FormikField)`
  background-color: ${COLORS.grey6};
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;
`;

const FieldText = ({ label, name, placeholder, required }: any) => {
  return (
    <>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <ErrorMessage name={name} component="span" />
      <Field type="text" name={name} placeholder={placeholder} />
    </>
  );
};

export default FieldText;
