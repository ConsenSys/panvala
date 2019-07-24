import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Slates from '../../pages/slates';
import Slate from '../../pages/slates/slate';
import SlateHeader from '../SlateHeader';
import SlateSidebar from '../SlateSidebar';
import { ISlate } from '../../interfaces';
import { currentBallot, unstakedSlate, makeSlate, makeBallot } from './data';
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
  ));

const ballot = makeBallot();
const acceptedGrantSlate = makeSlate({
  verifiedRecommender: true,
  status: 3,
  epochNumber: 0,
});
const rejectedGrantSlate = makeSlate(
  {
    status: 2,
  },
  acceptedGrantSlate
);
const acceptedGovSlate = makeSlate(
  {
    category: 'GOVERNANCE',
    verifiedRecommender: true,
    status: 3,
  },
  acceptedGrantSlate
);
const rejectedGovSlate = makeSlate(
  {
    status: 2,
  },
  acceptedGovSlate
);

storiesOf('Slates', module)
  .add('only grants', () => {
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
        ]}
        ballot={ballot}
      >
        <Slates />
      </Wrapper>
    );
  })
  .add('only governance', () => {
    return (
      <Wrapper slates={[acceptedGovSlate, rejectedGovSlate, rejectedGovSlate]} ballot={ballot}>
        <Slates />
      </Wrapper>
    );
  })
  .add('multiple categories', () => {
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          acceptedGovSlate,
          rejectedGovSlate,
          rejectedGovSlate,
        ]}
        ballot={ballot}
      >
        <Slates />
      </Wrapper>
    );
  })
  .add('only old epochs', () => {
    const newEpochBallot = makeBallot({ epochNumber: 420 });
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          acceptedGovSlate,
          rejectedGovSlate,
          rejectedGovSlate,
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
    return (
      <Wrapper
        slates={[
          acceptedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          rejectedGrantSlate,
          acceptedGovSlate,
          rejectedGovSlate,
          rejectedGovSlate,
          newAcceptedSlate,
          newRejectedSlate,
        ]}
        ballot={newEpochBallot}
      >
        <Slates />
      </Wrapper>
    );
  });
