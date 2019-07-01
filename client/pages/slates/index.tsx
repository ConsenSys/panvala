import * as React from 'react';
import styled from 'styled-components';

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
import { BN } from '../../utils/format';

const VisibilityFilterContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;
const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const Slates: React.SFC = () => {
  const { slates, currentBallot }: IMainContext = React.useContext(MainContext);
  const [visibleSlates, setVisibleSlates] = React.useState(slates);
  const [visibilityFilter, setVisibilityFilter] = React.useState('ALL');

  function handleSelectVisibilityFilter(filter: string) {
    setVisibilityFilter(filter);
  }

  React.useEffect(() => {
    if (slates.length > 0) {
      if (visibilityFilter === 'ALL') {
        setVisibleSlates(slates);
      } else if (visibilityFilter === 'CURRENT') {
        setVisibleSlates(
          slates.filter((s: ISlate) => BN(s.epochNumber).eq(currentBallot.epochNumber))
        );
      } else if (visibilityFilter === 'PAST') {
        setVisibleSlates(
          slates.filter((s: ISlate) => !BN(s.epochNumber).eq(currentBallot.epochNumber))
        );
      }
    }
  }, [slates, visibilityFilter]);

  return (
    <div>
      <Flex justifyBetween alignCenter wrap="true" mb={2}>
        <Flex alignCenter>
          <RouteTitle mr={3}>{'Slates'}</RouteTitle>
          <RouterLink href="/slates/create" as="/slates/create">
            <Button type="default">{'Add Slate'}</Button>
          </RouterLink>
        </Flex>
        <Deadline ballot={currentBallot} route="slates" />
      </Flex>

      <VisibilityFilterContainer>
        <Button
          onClick={() => handleSelectVisibilityFilter('ALL')}
          active={visibilityFilter === 'ALL'}
        >
          {'All'}
        </Button>

        <Button
          onClick={() => handleSelectVisibilityFilter('CURRENT')}
          active={visibilityFilter === 'CURRENT'}
        >
          {'Current'}
        </Button>
        <Button
          onClick={() => handleSelectVisibilityFilter('PAST')}
          active={visibilityFilter === 'PAST'}
        >
          {'Past'}
        </Button>
      </VisibilityFilterContainer>

      <CardsWrapper>
        {visibleSlates && visibleSlates.length > 0
          ? visibleSlates.map((slate: ISlate) => (
              <div key={slate.id}>
                <RouterLink href={`/slates/slate?id=${slate.id}`} as={`/slates/${slate.id}`}>
                  <Card
                    key={slate.id}
                    subtitle={slate.proposals.length + ' Grants Included'}
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
