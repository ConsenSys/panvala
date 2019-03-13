import * as React from 'react';
import styled from 'styled-components';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import RouteTitle from '../../components/RouteTitle';
import { statuses } from '../../utils/status';
import Deadline from '../../components/Deadline';
import { tsToDeadline } from '../../utils/datetime';
import { IAppContext } from '../../interfaces';
import RouterLink from '../../components/RouterLink';

interface IProps {
  errors?: string;
  account?: string;
  provider?: any;
  userAgent?: any;
}

const Proposals: React.SFC<IProps> = props => {
  console.log('props:', props);
  const { proposals, proposalDeadline }: IAppContext = React.useContext(AppContext);
  console.log('proposals:', proposals);

  return (
    <div>
      <div className="flex justify-between">
        <div className="flex">
          {/* TODO: componentize */}
          <RouteTitle className="mr3">{'Proposals'}</RouteTitle>
          <RouterLink
            href="/proposals/create"
            as="/proposals/create"
            classNames="flex items-center"
          >
            <Button type="default">{'Add Proposal'}</Button>
          </RouterLink>
        </div>
        {proposalDeadline && (
          <Deadline status={statuses.PROPOSAL_DEADLINE}>{`${tsToDeadline(
            proposalDeadline
          )}`}</Deadline>
        )}
      </div>

      <CardsWrapper>
        {proposals && proposals.length
          ? proposals.map((proposal: any) => (
              <div key={proposal.id}>
                <RouterLink
                  href={`/DetailedView?id=${proposal.id}`}
                  as={`/proposals/${proposal.id}`}
                >
                  <Card
                    title={proposal.title}
                    subtitle={proposal.tokensRequested + ' Tokens Requested'}
                    description={proposal.summary}
                    category={'GRANT PROPOSAL'}
                  />
                </RouterLink>
              </div>
            ))
          : null}
      </CardsWrapper>
    </div>
  );
};

const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

// settings for varied card heights
// const CardsWrapper = styled.div`
//   display: flex;
//   flex-flow: column wrap;
//   max-height: 50vh;
// `;

export default Proposals;
