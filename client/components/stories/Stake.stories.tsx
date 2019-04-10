import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { StakeActions, StakeContainer } from '../../pages/slates/Stake';

storiesOf('Stake', module)
  .add('StakeActions', () => <StakeActions />)
  .add('StakeContainer', () => <StakeContainer />);
