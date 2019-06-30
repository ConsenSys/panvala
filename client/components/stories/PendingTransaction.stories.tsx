import * as React from 'react';
import { storiesOf } from '@storybook/react';
import PendingTransaction from '../PendingTransaction';
import { StoryWrapper } from './utils.stories';

storiesOf('PendingTransaction', module).add('PendingTransaction', () => (
  <StoryWrapper>
    <PendingTransaction isOpen={true} setOpen={() => null} />
  </StoryWrapper>
));
