import { ErrorMessage as FormikError } from 'formik';
import styled from 'styled-components';

export const ErrorMessage: any = styled(FormikError)`
  font-weight: 400;
  font-size: 0.85rem;
  margin-left: 0.5em;
  color: red;
`;
