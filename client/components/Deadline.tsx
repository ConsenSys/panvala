import * as React from 'react';
import styled from 'styled-components';
import { color } from 'styled-system';
import { ITag, IBallotDates } from '../interfaces';
import { COLORS } from '../styles';
import { isBallotOpen, getPrefixAndDeadline } from '../utils/status';
import { tsToDeadline } from '../utils/datetime';

const StyledDeadline = styled.div<{ ballot: IBallotDates }>`
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 4px;
  border: none;
  background-color: ${({ ballot }: any) => (isBallotOpen(ballot) ? COLORS.yellow1 : COLORS.grey5)};
  color: ${COLORS.text};
  padding: 0.5rem;
  ${color};
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
`;

export default Deadline;
