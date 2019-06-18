import * as React from 'react';
import styled from 'styled-components';
import { ITag, IBallotDates } from '../interfaces';
import { COLORS } from '../styles';
import Tag from './Tag';
import { isBallotOpen, getPrefixAndDeadline } from '../utils/status';
import { tsToDeadline } from '../utils/datetime';

const StyledDeadline = styled(Tag)<{ ballot: IBallotDates }>`
  background-color: ${({ ballot }: any) => (isBallotOpen(ballot) ? COLORS.yellow1 : COLORS.grey5)};
  color: ${COLORS.text};
  letter-spacing: 0;
  height: 2rem;
`;

interface IProps extends ITag {
  ballot: IBallotDates;
  route: string;
}

const Deadline: React.FunctionComponent<IProps> = ({ ballot, route }) => {
  const { prefix, deadline: timestamp } = getPrefixAndDeadline(ballot, route);
  const deadline = timestamp === 0 ? '' : tsToDeadline(timestamp);
  return (
    <Wrapper>
      <StyledDeadline ballot={ballot}>{`${prefix} ${deadline}`}</StyledDeadline>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

export default Deadline;
