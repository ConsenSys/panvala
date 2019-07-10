import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles';
import Button from '../../components/Button';
import { MainContext, IMainContext } from '../../components/MainProvider';
import RouterLink from '../../components/RouterLink';
import { convertEVMSlateStatus, isPendingTokens, SlateStatus } from '../../utils/status';
import { StatelessPage, ISlate, IBallotDates, IProposal } from '../../interfaces';
import SectionLabel from '../../components/SectionLabel';
import Copy from '../../components/Copy';
import Tag from '../../components/Tag';
import Deadline from '../../components/Deadline';
import RouteTitle from '../../components/RouteTitle';
import Flex from '../../components/system/Flex';
import { DetailContainer, MetaColumn, MainColumn } from '../slates/slate';
import { TokensBorder, TokensSection } from '../../components/SlateSidebar';
import { Separator } from '../../components/Separator';

interface IProposalSidebarProps {
  proposal: IProposal;
  includedInSlates: ISlate[];
}

interface IProposalHeaderProps {
  proposal: IProposal;
  includedInSlates: ISlate[];
  currentBallot: IBallotDates;
}

export const ProposalHeader = ({
  proposal,
  includedInSlates,
  currentBallot,
}: IProposalHeaderProps): any => {
  if (includedInSlates.length > 0) {
    const slate = includedInSlates[0];

    return (
      <Flex justifyBetween alignCenter width="100%">
        <Flex>
          <Tag status={''}>{proposal.category.toUpperCase() + ' PROPOSAL'}</Tag>
          {!!SlateStatus[slate.status] && (
            <Tag status={convertEVMSlateStatus(slate.status)}>
              {convertEVMSlateStatus(slate.status)}
            </Tag>
          )}
        </Flex>
        <Deadline ballot={currentBallot} route="/proposals" />
      </Flex>
    );
  } else {
    return (
      <Flex>
        <Tag status={''}>{'GRANT PROPOSAL'}</Tag>
      </Flex>
    );
  }
};

export const ProposalSidebar = ({ proposal, includedInSlates }: IProposalSidebarProps): any => {
  const button = isPendingTokens('1') ? (
    <RouterLink href="/ballots" as="/ballots">
      <Button large type="default" m="0.5rem 0 2rem">
        {'View Ballot'}
      </Button>
    </RouterLink>
  ) : (
    <RouterLink href={`/slates/create/grant?id=${proposal.id}`} as={`/slates/create/grant`}>
      <Button large type="default" m="0.5rem 0 2rem">
        {'Add to a New Slate'}
      </Button>
    </RouterLink>
  );

  const slates =
    includedInSlates.length > 0
      ? includedInSlates.map(includedInSlate => (
          <RouterLink
            href={`/slates/slate?id=${includedInSlate.id}`}
            as={`/slates/${includedInSlate.id}`}
            key={includedInSlate.id}
          >
            <Copy>{includedInSlate.id}</Copy>
          </RouterLink>
        ))
      : <Copy>None</Copy>;

  return (
    <>
      {button}
      <TokensBorder>
        <TokensSection>
          <SectionLabel my="1rem">{'TOKENS REQUESTED'}</SectionLabel>
          <Copy>{proposal.tokensRequested}</Copy>
        </TokensSection>

        <Separator width="2" />

        <TokensSection>
          <SectionLabel my="1rem">{'CREATED BY'}</SectionLabel>
          <Copy>{proposal.firstName + ' ' + proposal.lastName}</Copy>

          <SectionLabel my="1rem">{'INCLUDED IN SLATES'}</SectionLabel>
          {slates}
        </TokensSection>
      </TokensBorder>
    </>
  );
};

interface IProps {
  query: {
    id: string;
  };
}

const Proposal: StatelessPage<IProps> = ({ query: { id } }) => {
  const { proposals, slates, currentBallot }: IMainContext = React.useContext(MainContext);
  // parse the proposal id from query
  const proposalID: number = parseInt(id);
  // find proposal
  const proposal: IProposal | undefined = (proposals as IProposal[]).find(
    (proposal: IProposal) => proposal.id === proposalID
  );

  if (!proposal) {
    return <div>Loading...</div>;
  }

  // check if proposal is included in any slates
  let includedInSlates: ISlate[] = [];
  if (slates) {
    includedInSlates = slates.filter(
      slate => slate.proposals.filter(p => p.id === proposal.id).length > 0
    );
  }

  return (
    <FlexColumn>
      <HeaderWrapper>
        <ProposalHeader
          proposal={proposal}
          includedInSlates={includedInSlates}
          currentBallot={currentBallot}
        />
      </HeaderWrapper>
      <RouteTitle>{proposal.title}</RouteTitle>

      <DetailContainer>
        <MetaColumn>
          <ProposalSidebar proposal={proposal} includedInSlates={includedInSlates} />
        </MetaColumn>
        <MainColumn>
          <SectionLabel my="1rem">{'PROJECT SUMMARY'}</SectionLabel>
          <Copy>{proposal.summary}</Copy>
          {proposal.projectTimeline && (
            <>
              <SectionLabel mt={4} mb="1rem">
                {'PROJECT TIMELINE'}
              </SectionLabel>
              <Copy>{proposal.projectTimeline}</Copy>
            </>
          )}
          {proposal.teamBackgrounds && (
            <>
              <SectionLabel mt={4} mb="1rem">
                {'PROJECT TEAM'}
              </SectionLabel>
              <Copy>{proposal.teamBackgrounds}</Copy>
            </>
          )}
        </MainColumn>
      </DetailContainer>
    </FlexColumn>
  );
};

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;
const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

Proposal.getInitialProps = async ({ query }) => {
  return {
    query,
  };
};

export default Proposal;
