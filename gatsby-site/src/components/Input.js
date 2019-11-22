import React from 'react';
import styled from 'styled-components';
import {
  space,
  color,
  layout,
  typography,
  flexbox,
  border,
  background,
  shadow,
  position,
} from 'styled-system';

const StyledInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  border-radius: 2px;
  padding: 0.8rem;
  font-size: 0.8rem;
  margin: 1rem 0;

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${flexbox};
  ${border};
  ${background}
  ${shadow};
  ${position};
`;

const ErrorMessage = styled.span`
  color: red;
  margin-left: 1rem;
`;

const Input = props => {
  console.log('props:', props);
  return (
    <>
      <StyledInput borderColor="greys.border" color="greys.dark" bg="greys.veryLight" {...props} />
      <ErrorMessage name={props.name} />
    </>
  );
};

export default Input;
