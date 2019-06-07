import * as React from 'react';
import { storiesOf } from '@storybook/react';
import CreateSlate from '../../pages/slates/create';
import Layout from '../Layout';
import NotificationsProvider from '../NotificationsProvider';
import { StoryWrapper } from './utils.stories';

storiesOf('Create Slate', module).add('Create slate w/o staking', () => {
  return (
    <StoryWrapper>
      <NotificationsProvider>
        <Layout>
          <CreateSlate />
        </Layout>
      </NotificationsProvider>
    </StoryWrapper>
  );
});
