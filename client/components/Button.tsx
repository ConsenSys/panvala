import React, { Children } from 'react';
import styled from 'styled-components';
import { COLORS, BUTTON_COLORS } from '../styles';
import { IButton } from '../interfaces';

const BaseButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: 0.02rem;
  font-family: 'Roboto';
  font-weight: 500;
  cursor: pointer;
`;

const StyledButton = styled(BaseButton)`
  height: 2rem;
  background-color: ${({ type }: any) =>
    type && (BUTTON_COLORS as any)[type] ? (BUTTON_COLORS as any)[type] : COLORS.white};
  color: ${({ active }: any) => (active ? COLORS.primary : COLORS.text)};
  ${({ active }: any) => active && 'box-shadow: 0px 3px 10px rgba(83, 172, 217, 0.16)'};
  padding: 0 0.6rem;
  margin: 0 1rem 0 0;
  border: 1px solid transparent;
  border-radius: 0.3rem;
  &:focus {
    box-shadow: 0px 3px 10px rgba(83, 172, 217, 0.16);
    outline: none;
  }
  font-size: 1rem;
  line-height: 1rem;
`;

const LargeButton = styled(BaseButton)`
  width: 100%;
  background-color: ${({ type }: any) => (type ? (BUTTON_COLORS as any)[type] : COLORS.white)};
  padding: 0.8rem 1.5rem;
  margin: 0 0.5rem 1rem;
  border: 2px solid ${COLORS.grey5};
  border-radius: 7px;
  font-size: 1.2rem;
`;

const Button: React.FunctionComponent<IButton> = props => {
  if (props.large) {
    return (
      <Wrapper>
        <LargeButton {...props}>{Children.toArray(props.children)}</LargeButton>
      </Wrapper>
    );
  }
  return (
    <Wrapper>
      <StyledButton {...props}>{Children.toArray(props.children)}</StyledButton>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default Button;
