import React, { Children } from 'react';
import styled from 'styled-components';
import { ITag } from '../interfaces';
import { COLORS } from '../styles';
import Tag from './Tag';
import { statuses, isPendingTokens, isPendingVote, isProposalDeadline } from '../utils/status';

const StyledDeadline = styled(Tag)`
  background-color: ${({ status }: any) =>
    isPendingTokens(status) || isProposalDeadline(status)
      ? COLORS.grey5
      : isPendingVote(status)
      ? COLORS.yellow1
      : 'rgba(89, 182, 230, 0.2)'};
  color: ${COLORS.text};
  letter-spacing: 0;
  height: 2rem;
`;

const Deadline: React.FunctionComponent<ITag> = (props: any) => {
  return (
    <Wrapper>
      <StyledDeadline {...props}>{`${
        isPendingTokens(props.status)
          ? 'SLATE STAKING DEADLINE'
          : isProposalDeadline(props.status)
          ? 'PROPOSAL DEADLINE'
          : 'VOTE UNTIL'
      } ${Children.toArray(props.children)} EST`}</StyledDeadline>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

export default Deadline;
