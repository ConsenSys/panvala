import * as React from 'react';
import styled from 'styled-components';
import { BigNumberish } from 'ethers/utils';
import { COLORS } from '../../styles';
import Button from '../../components/Button';
import Card, { CardAddress } from '../../components/Card';
import Deadline from '../../components/Deadline';
import { EthereumContext } from '../../components/EthereumProvider';
import { MainContext } from '../../components/MainProvider';
import RouterLink from '../../components/RouterLink';
import RouteTitle from '../../components/RouteTitle';
import SectionLabel from '../../components/SectionLabel';
import Tag from '../../components/Tag';
import { splitAddressHumanReadable, formatPanvalaUnits } from '../../utils/format';
import {
  StatelessPage,
  IMainContext,
  ISlate,
  IBallotDates,
  IProposal,
  IEthereumContext,
} from '../../interfaces';
import { convertEVMSlateStatus, statuses } from '../../utils/status';

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

interface IStakeSidebarProps {
  slate: ISlate;
  requiredStake: BigNumberish;
}
interface IStakeHeaderProps {
  slate: ISlate;
  currentBallot: IBallotDates;
}

export const SlateSidebar = ({ slate, requiredStake }: IStakeSidebarProps): any => {
  const status = convertEVMSlateStatus(slate.status);
  // button: 'Stake Tokens' or 'View Ballot' or null
  const button =
    status === statuses.PENDING_TOKENS ? (
      <RouterLink href={`/slates/stake?id=${slate.id}`} as={`/slates/stake/${slate.id}`}>
        <Button large type="default">
          {'Stake Tokens'}
        </Button>
      </RouterLink>
    ) : status === statuses.PENDING_VOTE ? (
      <RouterLink href="/ballots" as="/ballots">
        <Button large type="default">
          {'View Ballot'}
        </Button>
      </RouterLink>
    ) : null;

  const instructions =
    status === statuses.PENDING_TOKENS ? (
      <>
        <SectionLabel>{'STAKING REQUIREMENT'}</SectionLabel>
        <StakingRequirement>{formatPanvalaUnits(requiredStake)}</StakingRequirement>
      </>
    ) : null;

  const isStaked =
    status === statuses.PENDING_VOTE ||
    status === statuses.SLATE_ACCEPTED ||
    status === statuses.SLATE_REJECTED;
  console.log('slate:', slate);

  return (
    <>
      {button}
      <TokensBorder>
        <TokensSection>
          <div>{instructions}</div>
          <div className="f6 lh-copy">
            If you want the Panvala Awards Committee to keep making recommendations and approve of
            the work they have done, you should stake tokens on this slate.
          </div>
          <div className="f6 lh-copy">
            Tokens staked on a winning slate are returned to the slate recommender, along with any
            invoice proposal the slate recommender uses to compensate their work. Slates that are
            rejected by token holders have their token donated to the system to fund the social
            good.
          </div>
        </TokensSection>

        <Separator />

        <TokensSection>
          <SectionLabel lessMargin>{'CREATED BY'}</SectionLabel>
          <DarkText>{slate.owner}</DarkText>
          <CardAddress>{splitAddressHumanReadable(slate.recommenderAddress)}</CardAddress>

          {slate.verifiedRecommender ? (
            <>
              <SectionLabel lessMargin>{'ORGANIZATION'}</SectionLabel>
              <DarkText>{slate.organization}</DarkText>
            </>
          ) : null}
        </TokensSection>

        {isStaked && slate.staker && (
          <>
            <Separator />
            <TokensSection>
              <SectionLabel lessMargin>{'STAKED BY'}</SectionLabel>
              <CardAddress>{splitAddressHumanReadable(slate.staker)}</CardAddress>
            </TokensSection>
          </>
        )}
      </TokensBorder>
    </>
  );
};

export const SlateHeader = ({ slate, currentBallot }: IStakeHeaderProps) => {
  const status = convertEVMSlateStatus(slate.status);
  return (
    <>
      <div className="flex">
        <Tag status={''}>{slate.category.toUpperCase()}</Tag>
        <Tag status={status}>{status}</Tag>
      </div>
      {slate.deadline && <Deadline ballot={currentBallot} route={'/slates'} />}
    </>
  );
};

interface IProps {
  query: {
    id: string;
  };
}

const Slate: StatelessPage<IProps> = ({ query: { id } }) => {
  const { slates, currentBallot }: IMainContext = React.useContext(MainContext);
  const { slateStakeAmount }: IEthereumContext = React.useContext(EthereumContext);
  // parse the slate id from query
  const slateID: number = parseInt(id);
  // find slate
  let slate: ISlate | undefined = (slates as ISlate[]).find(
    (slate: ISlate) => slate.id === slateID
  );

  if (!slate) {
    return <div>Loading...</div>;
  }

  return (
    <FlexColumn>
      <HeaderWrapper>
        <SlateHeader slate={slate} currentBallot={currentBallot} />
      </HeaderWrapper>
      {slate.incumbent && <Incumbent>INCUMBENT</Incumbent>}
      <RouteTitle>{slate.title}</RouteTitle>

      <Container>
        <MetaColumn>
          <SlateSidebar slate={slate} requiredStake={slateStakeAmount} />
        </MetaColumn>
        <MainColumn>
          <SectionLabel>DESCRIPTION</SectionLabel>
          <DarkText>{slate.description}</DarkText>
          {slate.proposals.length ? (
            <>
              <SectionLabel>{'GRANTS'}</SectionLabel>
              <SlateProposals>
                {slate.proposals.map((proposal: IProposal) => (
                  <div key={proposal.id}>
                    <RouterLink
                      href={`/proposals/proposal?id=${proposal.id}`}
                      as={`/proposals/${proposal.id}`}
                    >
                      <Card
                        title={proposal.title}
                        subtitle={proposal.tokensRequested + ' Tokens Requested'}
                        description={proposal.summary}
                        category={`${slate.category} PROPOSAL`}
                      />
                    </RouterLink>
                  </div>
                ))}
              </SlateProposals>
            </>
          ) : null}
        </MainColumn>
      </Container>
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
`;

Slate.getInitialProps = async ({ query }) => {
  return {
    query,
  };
};

export default Slate;
