import * as React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { COLORS } from '../styles';
import { AppContext } from '../components/Layout';
import Button from '../components/Button';
import RouteTitle from '../components/RouteTitle';
import SectionLabel from '../components/SectionLabel';
import Tag from '../components/Tag';
import Card, { CardAddress } from '../components/Card';
import Deadline from '../components/Deadline';
import { IProposal, ISlate, IAppContext } from '../interfaces';
import { splitAddressHumanReadable, formatPanvalaUnits } from '../utils/format';
import { tsToDeadline } from '../utils/datetime';
import { isPendingTokens, isPendingVote } from '../utils/status';
import { StatelessPage } from '../interfaces/components';
import RouterLink from '../components/RouterLink';

const Incumbent = styled.div`
  color: ${COLORS.primary};
  font-weight: bold;
  font-size: 0.8rem;
  margin-top: 1rem;
`;

const Container = styled.div`
  display: flex;
  border: 2px solid ${COLORS.grey5};
`;
const MetaColumn = styled.div`
  width: 30%;
  padding: 2rem 1.5rem;
  border-right: 2px solid ${COLORS.grey5};
`;
const TokensSection = styled.div`
  border: 2px solid ${COLORS.grey5};
  padding: 0 1rem 1rem;
  color: ${COLORS.grey3};
  margin-top: 1em;
`;
const StakingRequirement = styled.div`
  font-size: 1.6rem;
  color: ${COLORS.grey1};
`;

const MainColumn = styled.div`
  width: 70%;
  padding: 1rem;
`;
const SlateProposals = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const DetailedView: StatelessPage<any> = ({ query, pathname, asPath }: any) => {
  console.log('query, pathname, asPath');
  console.log(query, pathname, asPath);
  const { slates, proposals }: IAppContext = React.useContext(AppContext);
  const slate: ISlate | undefined = (slates as ISlate[]).find(
    (slate: ISlate) => slate.id === query.id
  );
  const proposal: IProposal | undefined = (proposals as IProposal[]).find(
    (proposal: IProposal) => proposal.id.toString() === query.id
  );
  console.log('slate:', slate);
  console.log('proposal:', proposal);

  const slateOrProposal: any = slate ? slate : proposal;

  return (
    <div className="flex flex-column">
      <div className="flex justify-between">
        {slate ? (
          <>
            <div className="flex">
              <Tag status={''}>{slate.category.toUpperCase()}</Tag>
              <Tag status={slate.status}>{slate.status}</Tag>
            </div>
            {slate.deadline && (
              <Deadline status={slate.status}>{`${tsToDeadline(slate.deadline)}`}</Deadline>
            )}
          </>
        ) : (
          <Tag status={''}>{'GRANT PROPOSAL'}</Tag>
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
            (proposal && (
              <RouterLink href="/ballots" as="/ballots">
                <Button large type="default">
                  {'View Ballot'}
                </Button>
              </RouterLink>
            ))
          )}
          <TokensSection>
            <div>
              {slate && isPendingTokens(slate.status) ? (
                <>
                  <SectionLabel>{'STAKING REQUIREMENT'}</SectionLabel>
                  <StakingRequirement>{formatPanvalaUnits(slate.requiredStake)}</StakingRequirement>
                </>
              ) : (
                <>
                  <SectionLabel>{'TOKENS REQUESTED'}</SectionLabel>
                  <StakingRequirement>{slateOrProposal.tokensRequested}</StakingRequirement>
                </>
              )}
            </div>
            {slate && (
              <div className="f6 lh-copy">
                If you want the Panvala Awards Committee to keep making recommendations and approve
                of the work they have done, you should stake tokens on this slate.
              </div>
            )}
          </TokensSection>
          <TokensSection>
            <SectionLabel>{'CREATED BY'}</SectionLabel>
            <div>{slateOrProposal.title}</div>
            <CardAddress>
              {splitAddressHumanReadable(
                slateOrProposal.ownerAddress || slateOrProposal.awardAddress
              )}
            </CardAddress>

            <SectionLabel>{'ORGANIZATION'}</SectionLabel>
            <div>{slateOrProposal.organization}</div>
          </TokensSection>
        </MetaColumn>

        <MainColumn>
          <SectionLabel>{'DESCRIPTION'}</SectionLabel>
          <div>{slateOrProposal.description || slateOrProposal.summary}</div>
          <SectionLabel>{'GRANTS'}</SectionLabel>
          {slate && slate.proposals.length ? (
            <SlateProposals>
              {slate.proposals.map((proposal: IProposal, index: number) => (
                <Card
                  key={proposal.title + index}
                  title={proposal.title}
                  subtitle={proposal.tokensRequested + ' Tokens Requested'}
                  description={proposal.summary}
                  category={'GRANT PROPOSAL'}
                />
              ))}
            </SlateProposals>
          ) : (
            <div>Blank slate</div>
          )}
        </MainColumn>
      </Container>
    </div>
  );
};

DetailedView.getInitialProps = async ctx => {
  return ctx;
};

export default DetailedView;
