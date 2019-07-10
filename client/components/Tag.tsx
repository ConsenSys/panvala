import React, { Children } from 'react';
import styled from 'styled-components';
import { color } from 'styled-system';
import { ITag } from '../interfaces';
import { COLORS, colors } from '../styles';

const StyledTag = styled.div`
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
      : colors.blue};
  letter-spacing: 0.03rem;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  padding: 0.5rem 0.5rem;
  margin-right: 0.5rem;
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
