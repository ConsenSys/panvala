import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Withdraw from '../../pages/Withdraw';
import { StoryWrapper } from './utils.stories';

storiesOf('Withdraw', module)
  .add('Withdraw voting rights', () => {
    return (
      <StoryWrapper>
        <>
          <Withdraw query={{ id: '0' }} asPath="voting" />;
        </>
      </StoryWrapper>
    );
  })
  .add('Withdraw grant', () => {
    return (
      <StoryWrapper>
        <>
          <Withdraw query={{ id: '0' }} asPath="grant" />;
        </>
      </StoryWrapper>
    );
  })
  .add('Withdraw stake', () => {
    return (
      <StoryWrapper>
        <>
          <Withdraw query={{ id: '0' }} asPath="stake" />;
        </>
      </StoryWrapper>
    );
  });
