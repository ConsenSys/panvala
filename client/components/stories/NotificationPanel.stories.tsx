import * as React from 'react';
import { storiesOf } from '@storybook/react';

import NotificationPanel from '../NotificationPanel';

const emptyList = {
  items: [],
};

const props = {
  items: [
    { action: 'Welcome', text: 'Subtitle here' },
    { action: 'View ballot results', text: 'The ballot has concluded', link: '/ballot' },
    { action: 'Withdraw staked tokens from Slate Name', text: 'The current batch has ended.' },
  ],
  selectedItem: 1,
};

storiesOf('NotificationPanel', module)
  .add('Empty Closed', () => <NotificationPanel isOpen={false} {...emptyList} />)
  .add('Empty Open', () => <NotificationPanel isOpen={true} {...emptyList} />)
  .add('Non-empty closed', () => <NotificationPanel isOpen={false} {...props} />)
  .add('Non-empty open', () => <NotificationPanel isOpen={true} {...props} />);
