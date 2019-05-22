import * as React from 'react';
import { storiesOf } from '@storybook/react';
import CreateSlate from '../../pages/slates/create';
import MainProvider from '../MainProvider';
import Layout from '../Layout';
import EthereumProvider from '../EthereumProvider';
import NotificationsProvider from '../NotificationsProvider';

storiesOf('Create Slate', module).add('Stake immediately', () => {
  return (
    <EthereumProvider>
      <MainProvider>
        <NotificationsProvider>
          <Layout>
            <CreateSlate query={{ id: '0' }} />
          </Layout>
        </NotificationsProvider>
      </MainProvider>
    </EthereumProvider>
  );
});
