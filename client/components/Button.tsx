import React, { Children } from 'react';
import styled, { css } from 'styled-components';
import { COLORS, BUTTON_COLORS } from '../styles';
import { IButton } from '../interfaces';

const BaseButton: any = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: 0.02rem;
  font-family: 'Roboto';
  font-weight: 500;
  cursor: pointer;
`;

const StyledButton: any = styled(BaseButton)`
  height: 2rem;
  background-color: ${({ type }: any) => {
    if (type && (BUTTON_COLORS as any)[type]) return (BUTTON_COLORS as any)[type];
    return COLORS.white;
  }};
  color: ${({ active }: any) => (active ? COLORS.primary : COLORS.text)};

  ${({ active }: any) => {
    return (
      active &&
      css`
        box-shadow: 0px 3px 10px rgba(83, 172, 217, 0.16);
      `
    );
  }};
  padding: 0 0.6rem;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 0.3rem;
  &:focus {
    box-shadow: 0px 3px 10px rgba(83, 172, 217, 0.16);
    outline: none;
  }
  font-size: 1rem;
  line-height: 1rem;
`;

const LargeButton: any = styled(BaseButton)`
  width: ${({ width }) => (width ? width : '100%')};
  background-color: ${({ type }: any) => (type ? (BUTTON_COLORS as any)[type] : COLORS.white)};
  padding: 0.8rem 1rem;
  margin: 0 0.5rem 1rem;
  border: 2px solid ${COLORS.grey5};
  border-radius: 7px;
  font-size: 1rem;
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
