import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../styles';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import CenteredTitle from '../../components/CenteredTitle';
import { statuses, isBallotOpen } from '../../utils/status';
import Deadline from '../../components/Deadline';
import RouterLink from '../../components/RouterLink';
import RouteTitle from '../../components/RouteTitle';
import { IAppContext } from '../../interfaces';
import { AppContext } from '../../components/Layout';
import { tsToDeadline } from '../../utils/datetime';

const BallotWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2em;
  border: 1px solid #f0f5f6;
  color: ${COLORS.text};
`;

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const BallotNotOpen = styled.div`
  font-size: 1.5rem;
  color: ${COLORS.grey2};
  font-weight: 500;
`;

const Ballots: React.FunctionComponent<any> = () => {
  const { currentBallot }: IAppContext = React.useContext(AppContext);
  console.log('currentBallot:', currentBallot);
  return (
    <div>
      {!isBallotOpen(currentBallot) ? ( // temporary hack to bypass ballot opening deadline
        <>
          <div className="flex justify-end">
            <Deadline ballot={currentBallot} route="ballots" />
          </div>
          <CenteredTitle title="Submit Vote" />
          <BallotWrapper>
            <div className="pa4">
              <SectionLabel>{'HOW VOTING WORKS'}</SectionLabel>
              <div className="mb4 f6">
                Token holders rank the slates in each category in order of preference. They commit
                to their votes, which are revealed once the voting deadline is reached. If any slate
                has over half of the cast votes for its category, that slate wins and its proposals
                are executed. Otherwise, all slates except the top two in each category are
                eliminated, and the previously cast ballots are tallied. The slate with the most
                votes wins and will be executed.
              </div>

              <SectionLabel>{'VOTING WITH YOUR TOKENS'}</SectionLabel>
              <div className="mb4 f6">
                Once you are ready to commit your vote, you will use all of your Panvala tokens as
                your voting power. One Panvala token equals one vote. The more tokens you hold, the
                more voting power you have. All of your tokens will be held temporarily and will be
                returned to you upon the voting deadline. You will not lose or gain any tokens
                regardless of the outcome of the vote.
              </div>
            </div>
            <Separator />
            <div className="flex flex-column pv4 ph4 items-end">
              <div className="flex">
                <Button large>{'Back'}</Button>
                <RouterLink href="/ballots/vote" as="/ballots/vote">
                  <Button large type="default">
                    {'Continue'}
                  </Button>
                </RouterLink>
              </div>
            </div>
          </BallotWrapper>
        </>
      ) : !isBallotOpen(currentBallot) ? (
        <>
          <div className="flex justify-between">
            <div className="flex">
              <RouteTitle className="mr3">{'Ballots'}</RouteTitle>
            </div>
            <Deadline ballot={currentBallot} route="ballots" />
          </div>
          <BallotNotOpen>Oh no! The current ballot is not available just yet.</BallotNotOpen>
          <div className="mt3">
            {`Come back at a later time to view the current ballot. Voting will open up at ${tsToDeadline(
              currentBallot.votingOpenDate
            )}`}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Ballots;
