import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Stake from '../../pages/slates/stake';
import MainProvider from '../MainProvider';
import EthereumProvider from '../EthereumProvider';

storiesOf('Stake', module).add('Stake', () => (
  <EthereumProvider>
    <MainProvider>
      <Stake query={{ id: '0' }} />
    </MainProvider>
  </EthereumProvider>
));
