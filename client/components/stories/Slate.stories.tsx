import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Slates from '../../pages/slates';
import Slate from '../../pages/slates/slate';
import SlateHeader from '../SlateHeader';
import SlateSidebar from '../SlateSidebar';
import { ISlate } from '../../interfaces';
import {
  currentBallot,
  unstakedSlate,
  makeSlate,
  makeBallot,
  makeSlates,
  rejectedGrantSlate,
  acceptedGrantSlate,
  rejectedGovSlate,
  acceptedGovSlate,
  proposals,
  governanceProposals,
  governanceSlate,
} from './data';
import { SlateStatus } from '../../utils/status';
import { convertedToBaseUnits } from '../../utils/format';
import { StoryWrapper, Wrapper } from './utils.stories';

const unstakedIncumbent: ISlate = {
  ...unstakedSlate,
  incumbent: true,
};

const staker = '0xd115bffabbdd893a6f7cea402e7338643ced44a6';

const stakedSlate: ISlate = {
  ...unstakedSlate,
  status: 1,
  staker,
};

const stakedVerified: ISlate = {
  ...unstakedSlate,
  status: SlateStatus.Staked,
  verifiedRecommender: true,
  staker,
};

const acceptedSlate: ISlate = {
  ...stakedSlate,
  status: SlateStatus.Accepted,
  staker,
};

const rejectedSlate: ISlate = {
  ...stakedSlate,
  status: SlateStatus.Rejected,
  staker,
};

const requiredStake = convertedToBaseUnits('5000', 18);

storiesOf('SlateHeader', module)
  .add('unstaked', () => <SlateHeader slate={unstakedSlate} currentBallot={currentBallot} />)
  .add('staked', () => <SlateHeader slate={stakedSlate} currentBallot={currentBallot} />);

storiesOf('SlateSidebar', module)
  .add('unstaked', () => (
    <SlateSidebar
      slate={unstakedSlate}
      requiredStake={requiredStake}
      currentBallot={currentBallot}
    />
  ))
  .add('staked', () => (
    <SlateSidebar slate={stakedSlate} requiredStake={requiredStake} currentBallot={currentBallot} />
  ));

storiesOf('Slate', module)
  .add('unstaked', () => (
    <StoryWrapper slates={[unstakedSlate]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('unstaked incumbent', () => (
    <StoryWrapper slates={[unstakedIncumbent]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('staked unverified', () => (
    <StoryWrapper slates={[stakedSlate]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('staked verified', () => (
    <StoryWrapper slates={[stakedVerified]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('accepted', () => (
    <StoryWrapper slates={[acceptedSlate]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('rejected', () => (
    <StoryWrapper slates={[rejectedSlate]}>
      <Slate query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('multiple proposals with small summaries', () => {
    const proposal = proposals[0];
    const p1 = {
      ...proposal,
      summary: 'A tiny summary',
    };
    const p2 = {
      ...proposal,
      summary: 'A small summary',
    };
    const newSlate = {
      ...acceptedSlate,
      proposals: [p1, p2],
    };
    return (
      <StoryWrapper slates={[newSlate]} proposals={[p1, p2]}>
        <Slate query={{ id: '0' }} />
      </StoryWrapper>
    );
  })
  .add('governance', () => (
    <StoryWrapper slates={[governanceSlate]} proposals={governanceProposals}>
      <Slate query={{id: governanceSlate.id }} />
    </StoryWrapper>
  ));

const ballot = makeBallot();

storiesOf('Slates', module)
  .add('only grants', () => {
    const rejectedGrantSlates = makeSlates(4, rejectedGrantSlate);
    return (
      <Wrapper slates={[acceptedGrantSlate, ...rejectedGrantSlates]} ballot={ballot}>
        <Slates />
      </Wrapper>
    );
  })
  .add('only governance', () => {
    const rejectedGovSlates = makeSlates(2, rejectedGovSlate);
    return (
      <Wrapper slates={[acceptedGovSlate, ...rejectedGovSlates]} ballot={ballot}>
        <Slates />
      </Wrapper>
    );
  })
  .add('multiple categories', () => {
    const rejectedGrantSlates = makeSlates(4, rejectedGrantSlate);
    const rejectedGovSlates = makeSlates(2, rejectedGovSlate);
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          ...rejectedGrantSlates,
          acceptedGovSlate,
          ...rejectedGovSlates,
        ]}
        ballot={ballot}
      >
        <Slates />
      </Wrapper>
    );
  })
  .add('only old epochs', () => {
    const newEpochBallot = makeBallot({ epochNumber: 420 });
    const rejectedGrantSlates = makeSlates(4, rejectedGrantSlate);
    const rejectedGovSlates = makeSlates(2, rejectedGovSlate);
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          ...rejectedGrantSlates,
          acceptedGovSlate,
          ...rejectedGovSlates,
        ]}
        ballot={newEpochBallot}
      >
        <Slates />
      </Wrapper>
    );
  })
  .add('multiple epochs', () => {
    const newEpochBallot = makeBallot({ epochNumber: 420 });
    const newAcceptedSlate = makeSlate(
      { epochNumber: 420, organization: 'New Slate Organization' },
      acceptedGrantSlate
    );
    const newRejectedSlate = makeSlate({ status: 2 }, newAcceptedSlate);
    const rejectedGrantSlates = makeSlates(4, rejectedGrantSlate);
    const rejectedGovSlates = makeSlates(2, rejectedGovSlate);
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          ...rejectedGrantSlates,
          acceptedGovSlate,
          ...rejectedGovSlates,
          newAcceptedSlate,
          newRejectedSlate,
        ]}
        ballot={newEpochBallot}
      >
        <Slates />
      </Wrapper>
    );
  });
