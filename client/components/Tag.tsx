import React, { Children } from 'react';
import styled from 'styled-components';
import { color } from 'styled-system';
import { ITag } from '../interfaces';
import { COLORS } from '../styles';

const StyledTag = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ status }: any) =>
    status === 'PENDING VOTE'
      ? COLORS.grey5
      : status === 'PENDING TOKENS'
      ? COLORS.yellow1
      : status === 'ACCEPTED'
      ? COLORS.green1
      : status === 'REJECTED'
      ? COLORS.red1
      : 'rgba(89, 182, 230, 0.2)'};
  color: ${({ status }: any) =>
    status === 'PENDING VOTE'
      ? COLORS.grey3
      : status === 'PENDING TOKENS'
      ? COLORS.yellow2
      : status === 'ACCEPTED'
      ? COLORS.green2
      : status === 'REJECTED'
      ? COLORS.red2
      : COLORS.blue2};
  letter-spacing: 0.03rem;
  font-size: 0.7rem;
  font-weight: bold;
  line-height: 1rem;
  border-radius: 4px;
  margin-right: 1rem;
  margin-bottom: 0.4rem;
  height: 1.5rem;
  border: 1px solid transparent;
  padding: 0 0.5rem;
  ${color};
`;

const Tag: React.FunctionComponent<ITag> = props => {
  return (
    <Wrapper>
      <StyledTag {...props}>{Children.toArray(props.children)}</StyledTag>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

export default Tag;
