import React from 'react';
import styled from 'styled-components';
import Input from './Input';
import Label from './Label';

// TODO: after adding formik, import ErrorMessage from formik,
// remove this, remove the `props.error &&`,
// and provide `component="span"` as a prop
const ErrorMessage = styled.span`
  color: red;
  margin-left: 1rem;
`;

const FieldText = props => {
  return (
    <>
      <Label required={props.required}>{props.label}</Label>

      {props.error && <ErrorMessage name={props.name} />}

      <Input type={props.type || 'text'} {...props} />
    </>
  );
};

export default FieldText;
