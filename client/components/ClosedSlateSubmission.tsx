import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

import RouteTitle from './RouteTitle';
import Flex from './system/Flex';
import Box from './system/Box';
import A from './A';

import { tsToDeadline } from '../utils/datetime';

const SlateSubmissionClosed = styled.div`
  font-size: 1.5rem;
  color: ${COLORS.grey2};
  font-weight: 500;
`;

const ClosedSlateSubmission: React.FunctionComponent<any> = ({ category, deadline }) => {
  return (
    <>
      <Flex justifyBetween>
        <Flex>
          <RouteTitle mr={3}>{'Slates'}</RouteTitle>
        </Flex>
      </Flex>
      <SlateSubmissionClosed>{`Submission for ${category} slates has closed`}</SlateSubmissionClosed>
      <Box mt={3} mb={3}>
        {`Submission ended ${tsToDeadline(deadline)}`}
      </Box>
      <Box>
        <A color="blue" href="/slates">
          Go back home
        </A>
      </Box>
    </>
  );
};

export default ClosedSlateSubmission;
