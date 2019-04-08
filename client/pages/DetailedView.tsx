import * as React from 'react';
import styled from 'styled-components';
import { withRouter } from 'next/router';
import { COLORS } from '../styles';
import { AppContext } from '../components/Layout';
import Button from '../components/Button';
import RouteTitle from '../components/RouteTitle';
import SectionLabel from '../components/SectionLabel';
import Tag from '../components/Tag';
import Card, { CardAddress } from '../components/Card';
import Deadline from '../components/Deadline';
import { IProposal, ISlate, IAppContext, StatelessPage } from '../interfaces';
import { splitAddressHumanReadable, formatPanvalaUnits } from '../utils/format';
import { isPendingTokens, isPendingVote, statuses } from '../utils/status';
import RouterLink from '../components/RouterLink';

const Incumbent = styled.div`
  color: ${COLORS.primary};
  font-weight: bold;
  font-size: 0.8rem;
  margin-top: 1rem;
`;
const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const Container = styled.div`
  display: flex;
  border: 2px solid ${COLORS.grey5};
`;
const MetaColumn = styled.div`
  width: 30%;
  padding: 1.5rem 0;
  border-right: 2px solid ${COLORS.grey5};
`;
const TokensBorder = styled.div`
  margin: 0 1em;
  border: 2px solid ${COLORS.grey5};
`;
const TokensSection = styled.div`
  padding: 0 1.25rem 1rem;
  color: ${COLORS.grey3};
  margin-top: 1em;
`;
const StakingRequirement = styled.div`
  font-size: 1.6rem;
  color: ${COLORS.grey1};
`;
const DarkText = styled.div`
  color: ${COLORS.grey1};
`;

const MainColumn = styled.div`
  width: 70%;
  padding: 1.2rem;
`;
const SlateProposals = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const DetailedView: StatelessPage<any> = ({ router }) => {
  const { slates, proposals, currentBallot }: IAppContext = React.useContext(AppContext);

  const currentContext: string = router.asPath.startsWith('/slates') ? 'slates' : 'proposals';
  const identifier: number = parseInt(router.query.id);

  let slate: ISlate | undefined;
  let proposal: IProposal | undefined;
  let includedInSlates: ISlate[] = [];

  // Find the matching slate
  if (currentContext === 'slates') {
    slate = (slates as ISlate[]).find((slate: ISlate) => slate.id === identifier);
  } else if (currentContext === 'proposals') {
    // Or, find the matching proposal
    proposal = (proposals as IProposal[]).find((proposal: IProposal) => proposal.id === identifier);

    // Get the slates that it is included in
    if (proposal && slates) {
      includedInSlates = slates.filter(
        slate => slate.proposals.filter(p => p.id === proposal.id).length > 0
      );
      console.log('includedInSlates:', includedInSlates);
    }
  }

  // Set the target object
  const slateOrProposal: any = slate || proposal;
  console.log('slateOrProposal:', slateOrProposal);

  if (!slateOrProposal) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-column">
      <div className="flex justify-between">
        {slate ? (
          <>
            <div className="flex">
              <Tag status={''}>{slate.category.toUpperCase()}</Tag>
              <Tag status={slate.status}>{slate.status}</Tag>
            </div>
            {slate.deadline && <Deadline ballot={currentBallot} route={router.asPath} />}
          </>
        ) : proposal && includedInSlates && includedInSlates.length === 1 ? (
          <>
            <div className="flex">
              <Tag status={''}>{includedInSlates[0].category.toUpperCase() + ' PROPOSAL'}</Tag>
              {/* this should be proposal.status */}
              <Tag status={includedInSlates[0].status}>{includedInSlates[0].status}</Tag>
            </div>
            {includedInSlates[0].deadline && (
              <Deadline
                ballot={currentBallot}
                route={router.asPath}
                // deadline={includedInSlates[0].deadline}
                // status={includedInSlates[0].status}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex">
              <Tag status={''}>{'GRANT PROPOSAL'}</Tag>
              <Tag status={statuses.PENDING_TOKENS}>{'PENDING TOKENS'}</Tag>
            </div>
          </>
        )}
      </div>

      {slate && slate.incumbent && <Incumbent>INCUMBENT</Incumbent>}
      <RouteTitle>{slateOrProposal.title}</RouteTitle>

      <Container>
        <MetaColumn>
          {slate && isPendingTokens(slate.status) ? (
            <Button large type="default">
              {'Stake Tokens'}
            </Button>
          ) : (
            (slate && isPendingVote(slate.status)) ||
            (proposal && isPendingTokens('1') ? (
              <RouterLink href="/ballots" as="/ballots">
                <Button large type="default">
                  {'View Ballot'}
                </Button>
              </RouterLink>
            ) : (
              <RouterLink
                href={`/slates/create?selectedProposal=${identifier}`}
                as={`/slates/create`}
              >
                <Button large type="default">
                  {'Add to a New Slate'}
                </Button>
              </RouterLink>
            ))
          )}

          <TokensBorder>
            <TokensSection>
              <div>
                {slate && isPendingTokens(slate.status) ? (
                  <>
                    <SectionLabel>{'STAKING REQUIREMENT'}</SectionLabel>
                    <StakingRequirement>
                      {formatPanvalaUnits(slate.requiredStake)}
                    </StakingRequirement>
                  </>
                ) : (
                  <>
                    <SectionLabel lessMargin>{'TOKENS REQUESTED'}</SectionLabel>
                    <DarkText>{slateOrProposal.tokensRequested}</DarkText>
                  </>
                )}
              </div>
              {slate && (
                <div className="f6 lh-copy">
                  If you want the Panvala Awards Committee to keep making recommendations and
                  approve of the work they have done, you should stake tokens on this slate.
                </div>
              )}
            </TokensSection>

            <Separator />

            <TokensSection>
              <SectionLabel lessMargin>{'CREATED BY'}</SectionLabel>
              <DarkText>
                {proposal ? proposal.firstName + ' ' + proposal.lastName : slate && slate.owner}
              </DarkText>
              <SectionLabel lessMargin>{'EMAIL ADDRESS'}</SectionLabel>
              <DarkText>{proposal && proposal.email}</DarkText>
              <CardAddress>{slate && splitAddressHumanReadable(slate.ownerAddress)}</CardAddress>

              {slate && slate.verifiedRecommender ? (
                <>
                  <SectionLabel lessMargin>{'ORGANIZATION'}</SectionLabel>
                  <DarkText>{slateOrProposal.organization}</DarkText>
                </>
              ) : null}

              {includedInSlates && (
                <>
                  <SectionLabel lessMargin>{'INCLUDED IN SLATES'}</SectionLabel>
                  {includedInSlates.map(includedInSlate => (
                    <RouterLink
                      href={`/DetailedView?id=${includedInSlate.id}`}
                      as={`/slates/${includedInSlate.id}`}
                      key={includedInSlate.id}
                    >
                      <DarkText>{includedInSlate.title}</DarkText>
                    </RouterLink>
                  ))}
                </>
              )}
            </TokensSection>
          </TokensBorder>
        </MetaColumn>

        <MainColumn>
          <SectionLabel>{slate ? 'DESCRIPTION' : 'PROJECT SUMMARY'}</SectionLabel>
          <DarkText>{slateOrProposal.description || slateOrProposal.summary}</DarkText>
          {slate && slate.proposals.length ? (
            <>
              <SectionLabel>{'GRANTS'}</SectionLabel>
              <SlateProposals>
                {slate.proposals.map((proposal: IProposal, index: number) => (
                  <div key={proposal.id}>
                    <RouterLink
                      href={`/DetailedView?id=${proposal.id}`}
                      as={`/proposals/${proposal.id}`}
                    >
                      <Card
                        key={proposal.title + index}
                        title={proposal.title}
                        subtitle={proposal.tokensRequested + ' Tokens Requested'}
                        description={proposal.summary}
                        category={'GRANT PROPOSAL'}
                      />
                    </RouterLink>
                  </div>
                ))}
              </SlateProposals>
            </>
          ) : proposal ? (
            <>
              <SectionLabel>{'PROJECT TIMELINE'}</SectionLabel>
              <DarkText>{proposal.projectTimeline}</DarkText>
              <SectionLabel>{'PROJECT TEAM'}</SectionLabel>
              <DarkText>{proposal.teamBackgrounds}</DarkText>
            </>
          ) : null}
        </MainColumn>
      </Container>
    </div>
  );
};

export default withRouter(DetailedView);
