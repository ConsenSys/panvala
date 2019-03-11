import * as React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import RouteTitle from '../../components/RouteTitle';
import { statuses } from '../../utils/status';
import Deadline from '../../components/Deadline';
import { tsToDeadline } from '../../utils/datetime';

type Props = {
  errors?: string;
  account?: string;
  provider?: any;
  userAgent?: any;
};

const Proposals: React.FunctionComponent<Props> = () => {
  const { proposals, proposalDeadline }: any = React.useContext(AppContext);

  return (
    <div>
      <div className="flex justify-between">
        <div className="flex">
          {/* TODO: componentize */}
          <RouteTitle className="mr3">{'Proposals'}</RouteTitle>
          <Link passHref href="/proposals/create" as="/proposals/create">
            <a className="link flex items-center">
              <Button type="default">{'Add Proposal'}</Button>
            </a>
          </Link>
        </div>
        <Deadline status={statuses.PROPOSAL_DEADLINE}>{`${tsToDeadline(
          proposalDeadline
        )}`}</Deadline>
      </div>

      <CardsWrapper>
        {proposals &&
          proposals.map((proposal: any, index: number) => (
            <Card
              key={proposal.title + index}
              title={proposal.title}
              subtitle={proposal.tokensRequested + ' Tokens Requested'}
              description={proposal.summary}
              category={'GRANT PROPOSAL'}
            />
          ))}
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
