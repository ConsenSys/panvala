import * as React from 'react';
import { storiesOf } from '@storybook/react';
import CreateProposal from '../../pages/proposals/create';
import { StoryWrapper } from './utils.stories';

storiesOf('Create a Proposal', module).add('ProposalForm', () => {
  return (
    <StoryWrapper>
      <CreateProposal />
    </StoryWrapper>
  );
});
