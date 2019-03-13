import * as React from 'react';
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
import RouterLink from '../../components/RouterLink';

type Props = {
  errors?: string;
  account?: string;
  provider?: any;
  userAgent?: any;
};

const VisibilityFilterContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Slates: React.FunctionComponent<Props> = () => {
  const { slates, slateStakingDeadline }: IAppContext = React.useContext(AppContext);
  const [visibilityFilter] = React.useState('all');

  function handleSelectVisibilityFilter(type: string) {
    (toast as any)[type](`Demo: ${type}`);
  }

  return (
    <div>
      <div className="flex justify-between">
        {/* TODO: componentize */}
        <div className="flex">
          <RouteTitle className="mr3">{'Slates'}</RouteTitle>
          <RouterLink href="/slates/create" as="/slates/create" classNames="flex items-center">
            <Button type="default">{'Add Slate'}</Button>
          </RouterLink>
        </div>
        {slateStakingDeadline && (
          <Deadline status={statuses.PENDING_TOKENS}>{`${tsToDeadline(
            slateStakingDeadline
          )}`}</Deadline>
        )}
      </div>

      <VisibilityFilterContainer>
        <Button active={visibilityFilter === 'all'}>{'All'}</Button>
        <Button
          onClick={() => handleSelectVisibilityFilter('info')}
          active={visibilityFilter === 'current'}
        >
          {'Current'}
        </Button>
        <Button
          onClick={() => handleSelectVisibilityFilter('error')}
          active={visibilityFilter === 'past'}
        >
          {'Past'}
        </Button>
      </VisibilityFilterContainer>

      <CardsWrapper>
        {slates && slates.length
          ? slates.map((slate: ISlate) => (
              <div key={slate.id}>
                <RouterLink href={`/DetailedView?id=${slate.id}`} as={`/slates/${slate.id}`}>
                  <Card
                    key={slate.id}
                    title={slate.title}
                    subtitle={slate.proposals.length + ' Grants Included'}
                    description={slate.description}
                    category={slate.category}
                    status={slate.status}
                    address={slate.ownerAddress}
                    recommender={slate.owner}
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
  /* justify-content: space-between; */
`;

// settings for varied card heights
// const CardsWrapper = styled.div`
//   display: flex;
//   flex-flow: column wrap;
//   max-height: 50vh;
// `;

export default Slates;
