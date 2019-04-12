import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Stake, { StakeActions } from '../../pages/slates/stake';

// // https://github.com/zeit/next.js/issues/1827#issuecomment-323314141
// import Router from 'next/router';
// const mockedRouter = { push: () => {}, prefetch: () => {} };
// (Router as any).router = mockedRouter;

storiesOf('Stake', module)
  .add('StakeActions', () => <StakeActions />)
  .add('Stake', () => <Stake />);
