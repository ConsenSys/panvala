import * as React from 'react';
import styled from 'styled-components';
import { MainContext, IMainContext } from '../../components/MainProvider';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Deadline from '../../components/Deadline';
import RouterLink from '../../components/RouterLink';
import RouteTitle from '../../components/RouteTitle';
import { IProposal } from '../../interfaces';
import { PROPOSAL } from '../../utils/constants';
import Flex from '../../components/system/Flex';

const CardsWrapper = styled.div`
`;

const Proposals: React.SFC = () => {
  const { proposals, currentBallot }: IMainContext = React.useContext(MainContext);

  return (
    <div>
      <Flex justifyBetween alignCenter>
        <Flex alignCenter>
          <RouteTitle mr={3}>{'Proposals'}</RouteTitle>
          <RouterLink href="/proposals/create" as="/proposals/create">
            <Button type="default">{'Add Proposal'}</Button>
          </RouterLink>
        </Flex>
        <Deadline ballot={currentBallot} route="proposals" />
      </Flex>

      <CardsWrapper>
        {proposals && proposals.length > 0
          ? proposals.map((proposal: IProposal) => (
              <RouterLink
                href={`/proposals/proposal?id=${proposal.id}`}
                as={`/proposals/${proposal.id}`}
                key={proposal.id}
              >
                <Card
                  title={proposal.title}
                  subtitle={proposal.tokensRequested + ' Tokens Requested'}
                  description={proposal.summary}
                  category={`${proposal.category} PROPOSAL`}
                  type={PROPOSAL}
                />
              </RouterLink>
            ))
          : null}
      </CardsWrapper>
    </div>
  );
};

export default Proposals;
