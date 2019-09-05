import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

import Deadline from './Deadline';
import RouteTitle from './RouteTitle';
import Flex from './system/Flex';
import Box from './system/Box';

import { tsToDeadline } from '../utils/datetime';

const BallotNotOpen = styled.div`
  font-size: 1.5rem;
  color: ${COLORS.grey2};
  font-weight: 500;
`;

const ClosedBallot: React.FunctionComponent<any> = ({ currentBallot }) => {
  return (
    <>
      <Flex justifyBetween>
        <Flex>
          <RouteTitle mr={3}>{'Ballots'}</RouteTitle>
        </Flex>
        <Deadline ballot={currentBallot} route="ballots" />
      </Flex>
      <BallotNotOpen>Oh no! The current ballot is not available just yet.</BallotNotOpen>
      <Box mt={3}>
        {`Come back at a later time to view the current ballot. Voting will open up at ${tsToDeadline(
          currentBallot.votingOpenDate
        )}`}
      </Box>
    </>
  );
};

export default ClosedBallot;
