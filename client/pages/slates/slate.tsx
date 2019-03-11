import * as React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { withRouter } from 'next/router';
import { COLORS } from '../../styles';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import RouteTitle from '../../components/RouteTitle';
import SectionLabel from '../../components/SectionLabel';
import Tag from '../../components/Tag';
import Card, { CardAddress } from '../../components/Card';
import Deadline from '../../components/Deadline';
import { IProposal, ISlate } from '../../interfaces';
import { splitAddressHumanReadable, formatPanvalaUnits } from '../../utils/format';
import { tsToDeadline } from '../../utils/datetime';
import { statuses, isPendingTokens, isPendingVote } from '../../utils/status';

const Incumbent = styled.div`
  color: ${COLORS.primary};
  font-weight: bold;
  font-size: 0.8rem;
  margin-top: 1rem;
`;

const SlateContainer = styled.div`
  display: flex;
  border: 2px solid ${COLORS.grey5};
`;
const SlateMeta = styled.div`
  width: 30%;
  padding: 2rem 1.5rem;
  border-right: 2px solid ${COLORS.grey5};
`;
const SlateStaking = styled.div`
  border: 2px solid ${COLORS.grey5};
  padding: 0 1rem 1rem;
  color: ${COLORS.grey3};
  margin-top: 1em;
`;
const StakingRequirement = styled.div`
  font-size: 1.6rem;
  color: ${COLORS.grey1};
`;

const SlateMain = styled.div`
  width: 70%;
  padding: 1rem;
`;
const SlateProposals: any = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const Slate: React.FunctionComponent = ({ router }: any) => {
  console.log('router:', router);
  const { slates, proposals }: any = React.useContext(AppContext);
  console.log('proposals:', proposals);
  const slate = slates.find((slate: ISlate) => slate.id === router.query.id);

  return (
    <div className="flex flex-column">
      <div className="flex justify-between">
        <div className="flex">
          <Tag status={''}>{slate.category.toUpperCase()}</Tag>
          <Tag status={slate.status}>{slate.status}</Tag>
        </div>
        {slate.deadline && (
          <Deadline status={slate.status}>{`${tsToDeadline(slate.deadline)}`}</Deadline>
        )}
      </div>

      {slate.incumbent && <Incumbent>INCUMBENT</Incumbent>}
      <RouteTitle>{slate.title}</RouteTitle>

      <SlateContainer>
        <SlateMeta>
          {isPendingTokens(slate.status) ? (
            <Button large type="default">
              {'Stake Tokens'}
            </Button>
          ) : (
            isPendingVote(slate.status) && (
              <Link href="/ballots">
                <a className="link">
                  <Button large type="default">
                    {'View Ballot'}
                  </Button>
                </a>
              </Link>
            )
          )}
          <SlateStaking>
            {isPendingTokens(slate.status) && (
              <div>
                <SectionLabel>{'STAKING REQUIREMENT'}</SectionLabel>
                <StakingRequirement>{formatPanvalaUnits(slate.requiredStake)}</StakingRequirement>
              </div>
            )}
            <div className="f6 lh-copy">
              If you want the Panvala Awards Committee to keep making recommendations and approve of
              the work they have done, you should stake tokens on this slate.
            </div>
          </SlateStaking>
          <SlateStaking>
            <SectionLabel>{'CREATED BY'}</SectionLabel>
            <div>{slate.title}</div>
            <CardAddress>{splitAddressHumanReadable(slate.ownerAddress)}</CardAddress>

            <SectionLabel>{'ORGANIZATION'}</SectionLabel>
            <div>{slate.organization}</div>
          </SlateStaking>
        </SlateMeta>

        <SlateMain>
          <SectionLabel>{'DESCRIPTION'}</SectionLabel>
          <div>{slate.description}</div>
          <SectionLabel>{'GRANTS'}</SectionLabel>
          {proposals.length === 0 ? (
            <SlateProposals proposals={proposals}>
              {proposals.map((proposal: IProposal, index: number) => (
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
            <div>Blank</div>
          )}
        </SlateMain>
      </SlateContainer>
    </div>
  );
};

/* 
        Main
          SectionLabel
          Description

          SectionLabel
          Proposals
            [Card]
      */
export default withRouter(Slate);
