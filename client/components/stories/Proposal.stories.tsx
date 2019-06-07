import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Proposal, { ProposalHeader, ProposalSidebar } from '../../pages/proposals/proposal';
import { ISlate, IProposal } from '../../interfaces';
import { currentBallot, unstakedSlate, proposals } from './data';
import { SlateStatus } from '../../utils/status';
import { StoryWrapper } from './utils.stories';
import Layout from '../Layout';
import NotificationsProvider from '../NotificationsProvider';

const proposal: IProposal = proposals[0];

const pendingSlate: ISlate = {
  ...unstakedSlate,
  status: SlateStatus.Unstaked,
};
const acceptedSlate: ISlate = {
  ...unstakedSlate,
  status: SlateStatus.Accepted,
};

const rejectedSlate: ISlate = {
  ...unstakedSlate,
  status: SlateStatus.Rejected,
};

storiesOf('Proposal', module)
  .add('Header pending', () => (
    <ProposalHeader proposal={proposal} includedInSlates={[]} currentBallot={currentBallot} />
  ))
  .add('Header included', () => (
    <ProposalHeader
      proposal={proposal}
      includedInSlates={[pendingSlate]}
      currentBallot={currentBallot}
    />
  ))
  .add('Header rejected', () => (
    <ProposalHeader
      proposal={proposal}
      includedInSlates={[rejectedSlate]}
      currentBallot={currentBallot}
    />
  ))
  .add('Sidebar pending', () => <ProposalSidebar proposal={proposal} includedInSlates={[]} />)
  .add('Sidebar included', () => (
    <ProposalSidebar proposal={proposal} includedInSlates={[unstakedSlate]} />
  ))
  .add('Proposal pending', () => (
    <StoryWrapper proposals={[proposal]}>
      <Proposal query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('Proposal accepted', () => (
    <StoryWrapper slates={[acceptedSlate]} proposals={[proposal]}>
      <Proposal query={{ id: '0' }} />
    </StoryWrapper>
  ))
  .add('Proposal', () => (
    <StoryWrapper slates={[acceptedSlate]} proposals={[proposal]}>
      <NotificationsProvider>
        <Layout>
          <Proposal query={{ id: '0' }} />
        </Layout>
      </NotificationsProvider>
    </StoryWrapper>
  ));
