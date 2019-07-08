import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Slate from '../../pages/slates/slate';
import SlateHeader from '../SlateHeader';
import SlateSidebar from '../SlateSidebar';
import { ISlate } from '../../interfaces';
import { currentBallot, unstakedSlate } from './data';
import { SlateStatus } from '../../utils/status';
import { convertedToBaseUnits } from '../../utils/format';
import { StoryWrapper } from './utils.stories';

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

storiesOf('Slate with contexts', module)
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
