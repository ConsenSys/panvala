import * as React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { MainContext, IMainContext } from '../../components/MainProvider';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Deadline from '../../components/Deadline';
import Flex from '../../components/system/Flex';
import RouteTitle from '../../components/RouteTitle';
import RouterLink from '../../components/RouterLink';
import { ISlate } from '../../interfaces';
import { convertEVMSlateStatus } from '../../utils/status';
import { SLATE } from '../../utils/constants';

const VisibilityFilterContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;
const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const Slates: React.SFC = () => {
  const [visibilityFilter] = React.useState('all');
  let { slates, currentBallot }: IMainContext = React.useContext(MainContext);

  function handleSelectVisibilityFilter(type: string) {
    (toast as any)[type](`Demo: ${type}`);
  }

  return (
    <div>
      <Flex justifyBetween>
        {/* TODO: componentize */}
        <Flex alignCenter>
          <RouteTitle mr={3}>{'Slates'}</RouteTitle>
          <RouterLink href="/slates/create" as="/slates/create">
            <Button type="default">{'Add Slate'}</Button>
          </RouterLink>
        </Flex>
        <Deadline ballot={currentBallot} route="slates" />
      </Flex>

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
        {slates && slates.length > 0
          ? slates.map((slate: ISlate) => (
              <div key={slate.id}>
                <RouterLink href={`/slates/slate?id=${slate.id}`} as={`/slates/${slate.id}`}>
                  <Card
                    key={slate.id}
                    title={slate.title}
                    subtitle={slate.proposals && slate.proposals.length + ' Grants Included'}
                    description={slate.description}
                    category={slate.category}
                    status={convertEVMSlateStatus(slate.status)}
                    address={slate.recommender}
                    recommender={slate.organization}
                    verifiedRecommender={slate.verifiedRecommender}
                    type={SLATE}
                    incumbent={slate.incumbent}
                  />
                </RouterLink>
              </div>
            ))
          : null}
      </CardsWrapper>
    </div>
  );
};

export default Slates;
