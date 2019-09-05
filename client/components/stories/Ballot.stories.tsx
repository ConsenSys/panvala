import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Vote from '../../pages/ballots/vote';
import Ballots from '../../pages/ballots/index';
import { Wrapper } from './utils.stories';
import { ISlate } from '../../interfaces';
import { unstakedSlate } from './data';
import { timestamp } from '../../utils/datetime';
import { panvala_utils } from '../../utils';

const { durations } = panvala_utils.timing;
const { ballotDates } = panvala_utils.voting;

const staker = '0xd115bffabbdd893a6f7cea402e7338643ced44a6';

const stakedSlate: ISlate = {
  ...unstakedSlate,
  status: 1,
  staker,
};

const slate0: ISlate = {
  ...stakedSlate,
  id: 0,
  category: 'GRANT',
};

const slate1: ISlate = {
  ...stakedSlate,
  id: 1,
  category: 'GRANT',
};
const slate2: ISlate = {
  ...stakedSlate,
  id: 2,
  category: 'GOVERNANCE',
  proposals: [],
};
const slate3: ISlate = {
  ...stakedSlate,
  id: 3,
  category: 'GOVERNANCE',
  proposals: [],
};

const slates = [slate0, slate1, slate2, slate3];
const grantSlates = [slate0, slate1];
const governanceSlates = [slate2, slate3];

// use the current time to generate ballots
const now = timestamp();
// in the commit period
const openBallot = ballotDates(now - (durations.VOTING_PERIOD_START + 1));
// not in the commit period
const closedBallot = ballotDates(now - (durations.ONE_WEEK + 1));

storiesOf('Ballot', module)
  .add('Both categories', () => {
    return (
      <Wrapper slates={slates} ballot={openBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Grants only', () => {
    return (
      <Wrapper slates={grantSlates} ballot={openBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Governance only', () => {
    return (
      <Wrapper slates={governanceSlates} ballot={openBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Index page', () => {
    return (
      <Wrapper slates={slates} ballot={openBallot}>
        <Ballots />
      </Wrapper>
    );
  });

storiesOf('Closed ballot', module)
  .add('Both categories', () => {
    return (
      <Wrapper slates={slates} ballot={closedBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Grants only', () => {
    return (
      <Wrapper slates={grantSlates} ballot={closedBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Governance only', () => {
    return (
      <Wrapper slates={governanceSlates} ballot={closedBallot}>
        <Vote />
      </Wrapper>
    );
  })
  .add('Index page', () => {
    return (
      <Wrapper slates={slates} ballot={closedBallot}>
        <Ballots />
      </Wrapper>
    );
  });
