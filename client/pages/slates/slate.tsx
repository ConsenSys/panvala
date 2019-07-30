import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles';
import Box from '../../components/system/Box';
import Card from '../../components/Card';
import { MainContext, IMainContext } from '../../components/MainProvider';
import RouterLink from '../../components/RouterLink';
import RouteTitle from '../../components/RouteTitle';
import SectionLabel from '../../components/SectionLabel';
import { StatelessPage, ISlate, IProposal } from '../../interfaces';
import { PROPOSAL } from '../../utils/constants';
import SlateHeader from '../../components/SlateHeader';
import SlateSidebar from '../../components/SlateSidebar';
import { splitAddressHumanReadable } from '../../utils/format';

const Incumbent = styled.div`
  color: ${colors.blue};
  font-weight: bold;
  font-size: 0.8rem;
  margin-top: 1rem;
`;

export const DetailContainer = styled.div`
  display: flex;
  border: 2px solid ${colors.greys.light};
  max-width: 1200px;
`;
export const MetaColumn = styled.div`
  width: 30%;
  padding: 1.75rem;
  border-right: 2px solid ${colors.greys.light};
`;
export const MainColumn = styled.div`
  width: 70%;
  padding: 1.75rem 3rem;
`;
const SlateProposals = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

interface IProps {
  query: {
    id: string;
  };
}

const Slate: StatelessPage<IProps> = ({ query: { id } }) => {
  const { slates, currentBallot }: IMainContext = React.useContext(MainContext);
  // parse the slate id from query
  const slateID: number = parseInt(id);
  // find slate
  let slate: ISlate | undefined = (slates as ISlate[]).find(
    (slate: ISlate) => slate.id === slateID
  );

  if (slate == null) {
    return <div>Loading...</div>;
  }

  return (
    <SlateWrapper>
      <HeaderWrapper>
        <SlateHeader slate={slate} currentBallot={currentBallot} />
      </HeaderWrapper>

      {slate.incumbent && <Incumbent>INCUMBENT</Incumbent>}
      <RouteTitle>
        {slate.verifiedRecommender
          ? slate.organization
          : splitAddressHumanReadable(slate.recommender)}
      </RouteTitle>
      <DetailContainer>
        <MetaColumn>
          <SlateSidebar
            slate={slate}
            requiredStake={slate.requiredStake}
            currentBallot={currentBallot}
          />
        </MetaColumn>

        <MainColumn>
          <SectionLabel>DESCRIPTION</SectionLabel>
          <Box color="black" mb={5}>
            {slate.description}
          </Box>

          {slate.proposals && slate.proposals.length > 0 ? (
            <>
              <SectionLabel>{'GRANTS'}</SectionLabel>
              <SlateProposals>
                {slate.proposals.map((proposal: IProposal) => (
                  <RouterLink
                    href={`/proposals/proposal?id=${proposal.id}`}
                    as={`/proposals/${proposal.id}`}
                    key={proposal.id}
                  >
                    <Card
                      title={proposal.title}
                      subtitle={proposal.tokensRequested + ' Tokens Requested'}
                      description={proposal.summary}
                      category={`${slate.category} PROPOSAL`}
                      type={PROPOSAL}
                      width={['100%', '100%', '100%', '50%']}
                    />
                  </RouterLink>
                ))}
              </SlateProposals>
            </>
          ) : null}
        </MainColumn>
      </DetailContainer>
    </SlateWrapper>
  );
};

const SlateWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

Slate.getInitialProps = async ({ query }) => {
  return {
    query,
  };
};

export default Slate;
