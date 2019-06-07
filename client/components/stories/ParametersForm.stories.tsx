import * as React from 'react';
import { storiesOf } from '@storybook/react';
import ParametersForm from '../ParametersForm';
import Box from '../system/Box';
import { StoryWrapper } from './utils.stories';

storiesOf('ParametersForm', module).add('ParametersForm', () => (
  <StoryWrapper>
    <Box width="620px">
      <ParametersForm
        onChange={(name: string, value: any) => {
          console.log('name, value:', name, value);
        }}
        slateStakeAmount={'5000.0 PAN'}
        newSlateStakeAmount={''}
        newTokenAddress={''}
      />
    </Box>
  </StoryWrapper>
));
