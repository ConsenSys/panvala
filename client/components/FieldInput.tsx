import * as React from 'react';
import styled from 'styled-components';
import { Field as FormikField } from 'formik';
import { COLORS } from '../styles';
import { space, layout, fontFamily } from 'styled-system';
import { ErrorMessage } from './FormError';

const InputField: any = styled(FormikField)`
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;

  color: ${COLORS.grey2};
  background-color: ${COLORS.grey6};

  ${space};
  ${layout};
  ${fontFamily}
`;

const FieldInput = ({ name, placeholder }: any) => {
  return (
    <>
      <InputField component="input" name={name} placeholder={placeholder} />
      <ErrorMessage name={name} component="span" />
    </>
  );
};

export default FieldInput;
