import * as React from 'react';
import Link from 'next/link';
import { withRouter, SingletonRouter } from 'next/router';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Deadline from '../../components/Deadline';
import RouteTitle from '../../components/RouteTitle';
import { tsToDeadline } from '../../utils/datetime';
import { statuses } from '../../utils/status';
import { ISlate, IAppContext } from '../../interfaces';

type Props = {
  errors?: string;
  account?: string;
  provider?: any;
  userAgent?: any;
  router: SingletonRouter;
};

const VisibilityFilterContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Slates: React.FunctionComponent<Props> = ({ router }) => {
  const { slates, slateStakingDeadline }: IAppContext = React.useContext(AppContext);
  const [visibilityFilter] = React.useState('all');

  const handleClickSlate = (slate: ISlate) => {
    router.push({
      pathname: '/slates/slate',
      // asPath: `/slates/${slate.id}`,
      query: {
        id: slate.id,
      },
    });
  };

  function handleSelectVisibilityFilter() {
    toast.error('Demo Error');
  }

  return (
    <div>
      <div className="flex justify-between">
        {/* TODO: componentize */}
        <div className="flex">
          <RouteTitle className="mr3">{'Slates'}</RouteTitle>
          <Link passHref href="/slates/create" as="/slates/create">
            <a className="link flex items-center">
              <Button type="default">{'Add Slate'}</Button>
            </a>
          </Link>
        </div>
        {slateStakingDeadline && (
          <Deadline status={statuses.PENDING_TOKENS}>{`${tsToDeadline(
            slateStakingDeadline
          )}`}</Deadline>
        )}
      </div>

      <VisibilityFilterContainer>
        <Button active={visibilityFilter === 'all'}>{'All'}</Button>
        <Button active={visibilityFilter === 'current'}>{'Current'}</Button>
        <Button onClick={handleSelectVisibilityFilter} active={visibilityFilter === 'past'}>
          {'Past'}
        </Button>
      </VisibilityFilterContainer>

      <CardsWrapper>
        {slates &&
          slates.length &&
          slates.map((slate: ISlate) => (
            <Card
              key={slate.id}
              title={slate.title}
              subtitle={slate.proposals.length + ' Grants Included'}
              description={slate.description}
              category={slate.category}
              status={slate.status}
              address={slate.ownerAddress}
              recommender={slate.owner}
              onClick={() => handleClickSlate(slate)}
            />
          ))}
      </CardsWrapper>
    </div>
  );
};
const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  /* justify-content: space-between; */
`;

// settings for varied card heights
// const CardsWrapper = styled.div`
//   display: flex;
//   flex-flow: column wrap;
//   max-height: 50vh;
// `;

export default withRouter(Slates);
