import * as React from 'react';
import styled from 'styled-components';
import { BigNumberish } from 'ethers/utils';
import { CardAddress } from './Card';
import Button from './Button';
import Box from './system/Box';
import Text from './system/Text';
import RouterLink from './RouterLink';
import SectionLabel from './SectionLabel';
import { Separator } from './Separator';
import { formatPanvalaUnits, splitAddressHumanReadable } from '../utils/format';
import { convertEVMSlateStatus, statuses, slateSubmissionDeadline } from '../utils/status';
import { timestamp, tsToDeadline } from '../utils/datetime';
import { ISlate, IBallotDates } from '../interfaces';
import { colors } from '../styles';

export const TokensBorder = styled.div`
  border: 2px solid ${colors.greys.light};
`;
export const TokensSection = styled.div`
  padding: 0 1.3rem 1rem;
  color: ${colors.grey};
  margin-top: 1em;
`;

interface IStakeSidebarProps {
  slate: ISlate;
  requiredStake: BigNumberish;
  currentBallot: IBallotDates;
}

const SlateSidebar = ({ slate, requiredStake, currentBallot }: IStakeSidebarProps): any => {
  const status = convertEVMSlateStatus(slate.status);
  // button: 'Stake Tokens' or 'View Ballot' or null
  const button =
    status === statuses.PENDING_TOKENS ? (
      <RouterLink href={`/slates/stake?id=${slate.id}`} as={`/slates/${slate.id}/stake`}>
        <Button large type="default" m="0.5rem 0 2rem">
          {'Stake Tokens'}
        </Button>
      </RouterLink>
    ) : status === statuses.PENDING_VOTE ? (
      <RouterLink href="/ballots" as="/ballots">
        <Button large type="default" m="0.5rem 0 2rem">
          {'View Ballot'}
        </Button>
      </RouterLink>
    ) : null;

  const isStaked =
    status === statuses.PENDING_VOTE ||
    status === statuses.SLATE_ACCEPTED ||
    status === statuses.SLATE_REJECTED;
  console.log('slate:', slate);

  // Calculate the extended deadline from now and the start of the commit period,
  // assuming you were to stake right now
  const now = timestamp();
  const newDeadline = slateSubmissionDeadline(currentBallot.votingOpenDate, now);

  return (
    <>
      {button}

      {status === statuses.PENDING_TOKENS ? (
        <Text lineHeight="copy" mt="0">
          {`By staking on a slate, the slate submission period will be extended to
            ${tsToDeadline(newDeadline)} so that others have time to respond.`}
        </Text>
      ) : null}

      <TokensBorder>
        <TokensSection>
          {status === statuses.PENDING_TOKENS && (
            <>
              <SectionLabel my="1rem">{'STAKING REQUIREMENT'}</SectionLabel>
              <Box fontSize="1.6rem" fontWeight="500" color="black">
                {formatPanvalaUnits(requiredStake)}
              </Box>
            </>
          )}

          <Text fontSize={0} color="grey" lineHeight="21px" letterSpacing="0.03em">
            {status === statuses.PENDING_TOKENS
              ? `If you want ${
                  slate.organization
                } to keep making recommendations and approve of the work they have done, you should stake tokens on this slate.`
              : status !== statuses.SLATE_REJECTED &&
                `Evaluate which slate should be accepted for the current batch and cast your vote accordingly.`}
          </Text>
          <Text fontSize={0} color="grey" lineHeight="21px" letterSpacing="0.03em">
            Tokens staked on a winning slate are returned to the slate recommender, along with any
            invoice proposal the slate recommender uses to compensate their work. Slates that are
            rejected by token holders have their token donated to the system to fund the social
            good.
          </Text>
        </TokensSection>

        <Separator />

        <TokensSection>
          <SectionLabel my="1rem">{'CREATED BY'}</SectionLabel>
          <Box color="black">{slate.owner}</Box>
          <CardAddress>{splitAddressHumanReadable(slate.recommender)}</CardAddress>

          <SectionLabel my="1rem">{'ORGANIZATION'}</SectionLabel>
          <Box color="black">{slate.organization}</Box>
        </TokensSection>

        {isStaked && slate.staker && (
          <>
            <Separator />
            <TokensSection>
              <SectionLabel my="1rem">{'STAKED BY'}</SectionLabel>
              <CardAddress>{splitAddressHumanReadable(slate.staker)}</CardAddress>
            </TokensSection>
          </>
        )}
      </TokensBorder>
    </>
  );
};

export default SlateSidebar;
