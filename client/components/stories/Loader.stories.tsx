import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Loader from '../Loader';
import { StoryWrapper } from './utils.stories';

storiesOf('Loader', module).add('Loader', () => (
  <StoryWrapper>
    <Loader isOpen={true} setOpen={() => null} numTxs={2} />
  </StoryWrapper>
));
