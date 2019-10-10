import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles';
import Box from '../../components/system/Box';
import Card from '../../components/Card';
import { MainContext, IMainContext } from '../../components/MainProvider';
import RouterLink from '../../components/RouterLink';
import RouteTitle from '../../components/RouteTitle';
import SectionLabel from '../../components/SectionLabel';
import { StatelessPage, ISlate, IProposal, IGovernanceProposal } from '../../interfaces';
import { PROPOSAL } from '../../utils/constants';
import SlateHeader from '../../components/SlateHeader';
import SlateSidebar from '../../components/SlateSidebar';
import Flex, { BreakableFlex } from '../../components/system/Flex';
import {
  splitAddressHumanReadable,
  formatParameter,
  parameterDisplayName,
} from '../../utils/format';

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

const GrantSlateDetail = ({ slate }) => {
  const hasProposals = slate.proposals && slate.proposals.length > 0;
  return (
    <>
      <SectionLabel>{'GRANTS'}</SectionLabel>
      {hasProposals ? (
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
                category={'GRANT PROPOSAL'}
                type={PROPOSAL}
                width={['100%', '100%', '100%', '50%']}
              />
            </RouterLink>
          ))}
        </SlateProposals>
      ) : (
        <div>No proposals included.</div>
      )}
    </>
  );
};

interface IGovProps {
  slate: ISlate;
}

interface IChange {
  oldValue: any;
  newValue: any;
  type: any;
  key: any;
}

const GovernanceSlateDetail = ({ slate }: IGovProps) => {
  const hasProposals = slate.proposals && slate.proposals.length > 0;

  // We expect a key `parameterChanges on each proposal
  // HACK, coerce to governance proposal until we work out an ISlate that encompasses all types of
  // proposals
  const proposals = slate.proposals as unknown;
  const changes: IChange[] = (proposals as IGovernanceProposal[]).map(
    (p: IGovernanceProposal) => p.parameterChanges
  );

  return (
    <>
      <SectionLabel>{'PARAMETER CHANGES'}</SectionLabel>
      {hasProposals ? (
        <Flex column mt={4}>
          <Flex p={3} justifyBetween alignCenter width="100%" fontWeight="bold" bg="greys.light">
            <Flex justifyStart width="50%">
              Parameter Name
            </Flex>
            <Flex justifyStart width="50%">
              Current Value
            </Flex>
            <Flex justifyStart width="50%">
              New Value
            </Flex>
          </Flex>

          {changes.map((proposal: IChange) => (
            <Flex
              p={3}
              justifyBetween
              alignCenter
              width="100%"
              bg="white"
              border={1}
              borderColor="greys.light"
              key={proposal.key}
            >
              <Flex width="50%" fontSize={1}>
                {parameterDisplayName(proposal.key)}
              </Flex>
              <BreakableFlex width="50%" fontSize={1}>
                {formatParameter(proposal.oldValue, proposal.type)}
              </BreakableFlex>
              <BreakableFlex width="50%" fontSize={1}>
                {formatParameter(proposal.newValue, proposal.type)}
              </BreakableFlex>
            </Flex>
          ))}
        </Flex>
      ) : (
        <div>No proposals included.</div>
      )}
    </>
  );
};

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

          {slate.category === 'GRANT' ? (
            <GrantSlateDetail slate={slate} />
          ) : (
            <GovernanceSlateDetail slate={slate} />
          )}
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
