import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

export const StyledInput = styled.input`
  background-color: ${COLORS.grey6};
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
`;

const StyledTextArea = styled.textarea`
  background-color: ${COLORS.grey6};
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
`;

interface Props {
  placeholder: string;
  maxLength?: number;
  textarea?: boolean;
  id?: string;
  name?: string;
  type?: string;
  required?: boolean;
  onChange?: any;
  value?: any;
}

const Input: React.FunctionComponent<Props> = props => {
  let input = <StyledInput {...props} />;

  if (props.textarea) {
    input = <StyledTextArea {...props} />;
  }

  return <Wrapper>{input}</Wrapper>;
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.grey3};
  margin-top: 0.5rem;
  margin-right: 1rem;
  margin-bottom: 1.5rem;
`;

export default Input;
