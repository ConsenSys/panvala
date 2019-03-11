import * as React from 'react';
import Link from 'next/link';
import { withRouter, SingletonRouter } from 'next/router';
import styled from 'styled-components';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import RouteTitle from '../../components/RouteTitle';
import { ISlate } from '../../interfaces';
import { toast } from 'react-toastify';
import Deadline from '../../components/Deadline';
import { tsToDeadline } from '../../utils/datetime';
import { statuses } from '../../utils/status';

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
  const { slates, slateStakingDeadline }: any = React.useContext(AppContext);
  // console.log("slates:", slates);
  const [visibilityFilter, setVisibilityFilter] = React.useState('all');

  function handleClickSlate(slate: ISlate) {
    router.push({
      pathname: '/slates/slate',
      // asPath: `/slates/${slate.id}`,
      query: {
        id: slate.id,
      },
    });
  }

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
        <Deadline status={statuses.PENDING_TOKENS}>{`${tsToDeadline(
          slateStakingDeadline
        )}`}</Deadline>
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
          slates.map((slate: any, index: number) => (
            <div key={slate.title + index} onClick={() => handleClickSlate(slate)}>
              <Card
                key={slate.title + index}
                title={slate.title}
                subtitle={slate.subtitle}
                description={slate.description}
                category={slate.category}
                // TODO: translate status to enum value
                status={slate.status}
                address={slate.ownerAddress}
                recommender={slate.owner}
                // onClick={() => onHandleSelectSlate(slate.title)}
              />
            </div>
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
