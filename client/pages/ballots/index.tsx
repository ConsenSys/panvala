import * as React from 'react';
import styled from 'styled-components';

import { COLORS } from '../../styles';
import { MainContext } from '../../components/MainProvider';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Deadline from '../../components/Deadline';
import RouteTitle from '../../components/RouteTitle';
import SectionLabel from '../../components/SectionLabel';
import { IMainContext } from '../../interfaces';
import { tsToDeadline } from '../../utils/datetime';
import { isBallotOpen } from '../../utils/status';
import Flex from '../../components/system/Flex';
import Box from '../../components/system/Box';
import RouteActions from '../../components/RouteActions';

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const BallotNotOpen = styled.div`
  font-size: 1.5rem;
  color: ${COLORS.grey2};
  font-weight: 500;
`;

const Ballots: React.FunctionComponent<any> = () => {
  const { currentBallot }: IMainContext = React.useContext(MainContext);
  return (
    <>
      {!isBallotOpen(currentBallot) ? ( // temporary hack to bypass ballot opening deadline
        <>
          <Flex justifyEnd>
            <Deadline ballot={currentBallot} route="ballots" />
          </Flex>
          <CenteredTitle title="Submit Vote" />
          <CenteredWrapper>
            <Box p={4}>
              <SectionLabel>{'HOW VOTING WORKS'}</SectionLabel>
              <Box mb={4} fontSize={1}>
                Token holders rank the slates in each category in order of preference. They commit
                to their votes, which are revealed once the voting deadline is reached. If any slate
                has over half of the cast votes for its category, that slate wins and its proposals
                are executed. Otherwise, all slates except the top two in each category are
                eliminated, and the previously cast ballots are tallied. The slate with the most
                votes wins and will be executed.
              </Box>

              <SectionLabel>{'VOTING WITH YOUR TOKENS'}</SectionLabel>
              <Box mb={4} fontSize={1}>
                Once you are ready to commit your vote, you will use all of your Panvala tokens as
                your voting power. One Panvala token equals one vote. The more tokens you hold, the
                more voting power you have. All of your tokens will be held temporarily and will be
                returned to you upon the voting deadline. You will not lose or gain any tokens
                regardless of the outcome of the vote.
              </Box>
            </Box>
            <Separator />
            <RouteActions href="/ballots/vote" as="/ballots/vote" text="Continue" />
          </CenteredWrapper>
        </>
      ) : !isBallotOpen(currentBallot) ? (
        <>
          <Flex justifyBetween>
            <Flex>
              <RouteTitle className="mr3">{'Ballots'}</RouteTitle>
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
      ) : null}
    </>
  );
};

export default Ballots;
