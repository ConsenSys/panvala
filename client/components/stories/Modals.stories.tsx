import * as React from 'react';
import { storiesOf } from '@storybook/react';
import MainnetModal from '../MainnetModal';
import { StoryWrapper } from './utils.stories';
import Loader from '../Loader';
import PendingTransaction from '../PendingTransaction';

storiesOf('Modals', module)
  .add('Mainnet warning', () => {
    return (
      <StoryWrapper>
        <MainnetModal modalIsOpen={true} setMainnetModalOpen={() => null} />
      </StoryWrapper>
    );
  })
  .add('Loader', () => {
    return (
      <StoryWrapper>
        <Loader isOpen={true} setOpen={() => null} numTxs={2} />
      </StoryWrapper>
    );
  })
  .add('PendingTransaction', () => {
    return (
      <StoryWrapper>
        <PendingTransaction isOpen={true} setOpen={() => null} />
      </StoryWrapper>
    );
  });
