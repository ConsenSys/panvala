import * as React from 'react';
import styled from 'styled-components';
import { Field as FormikField, ErrorMessage as FormikError } from 'formik';
import { COLORS } from '../styles';
import Label from './Label';

export const Field = styled(FormikField)`
  background-color: ${COLORS.grey6};
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;
`;

export const ErrorMessage: any = styled(FormikError)`
  font-weight: 400;
  font-size: 0.85rem;
  margin-left: 0.5em;
  color: red;
`;

const FieldText = ({ label, name, placeholder, required }: any) => {
  return (
    <>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {required && <ErrorMessage name={name} component="span" />}
      <Field type="text" name={name} placeholder={placeholder} />
    </>
  );
};

export default FieldText;
