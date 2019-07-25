import * as React from 'react';
import { storiesOf } from '@storybook/react';
import TimeTraveler from '../TimeTraveler';
import { StoryWrapper } from './utils.stories';
import { currentBallot } from './data';

storiesOf('TimeTraveler', module).add('TimeTraveler', () => {
  const ballot = {
    ...currentBallot,
    epochNumber: 0,
  };
  return (
    <StoryWrapper ballot={ballot}>
      <TimeTraveler />
    </StoryWrapper>
  );
});
