import * as React from 'react';
import { storiesOf } from '@storybook/react';

import NotificationPanel from '../NotificationPanel';
import { StoryWrapper } from './utils.stories';

const emptyList = {
  notifications: [],
};

const props = {
  notifications: [
    { action: 'Welcome', text: 'Subtitle here' },
    // { action: 'View ballot results', text: 'The ballot has concluded', link: '/ballot' },
    // { action: 'Withdraw staked tokens from Slate Name', text: 'The current batch has ended.' },
    { action: 'Sign in with MetaMask', text: '' },
  ],
  selectedItem: 1,
};

storiesOf('NotificationPanel', module)
  .add('Empty', () => (
    <StoryWrapper>
      <NotificationPanel {...emptyList} />
    </StoryWrapper>
  ))
  .add('Non-empty', () => <NotificationPanel {...props} />);
