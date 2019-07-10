import React, { Children } from 'react';
import styled, { css } from 'styled-components';
import { COLORS, BUTTON_COLORS } from '../styles';
import { IButton } from '../interfaces';
import { color, layout, space } from 'styled-system';

const BaseButton: any = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Roboto';
  cursor: pointer;
  font-weight: 500;
`;

const StyledButton: any = styled(BaseButton)`
  height: 2rem;
  background-color: ${({ type }: any) => {
    if (type && BUTTON_COLORS[type]) return BUTTON_COLORS[type];
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
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  border-radius: 4px;
  &:focus {
    box-shadow: 0px 3px 10px rgba(83, 172, 217, 0.16);
    outline: none;
  }
  font-size: 0.85rem;
  line-height: 1rem;
  ${color};
  ${layout};
  ${space};
`;

const LargeButton: any = styled(BaseButton)`
  width: 100%;
  background-color: ${({ type }: any) => (type ? BUTTON_COLORS[type] : COLORS.white)};
  padding: 0.8rem 1rem;
  margin: 0 0.5rem 1rem;
  border: 2px solid ${COLORS.grey5};
  border-radius: 7px;
  font-size: 1rem;
  ${color};
  ${layout};
  ${space};
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
