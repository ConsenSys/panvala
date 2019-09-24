import * as React from 'react';
import { storiesOf } from '@storybook/react';
import CreateSlate from '../../pages/slates/create';
import Layout from '../Layout';
import NotificationsProvider from '../NotificationsProvider';
import { StoryWrapper } from './utils.stories';
import CreateGrantSlate from '../../pages/slates/create/grant';
import CreateGovernanceSlate from '../../pages/slates/create/governance';
import { timestamp } from '../../utils/datetime';
import { panvala_utils } from '../../utils';
import ClosedSlateSubmission from '../ClosedSlateSubmission';

const { durations } = panvala_utils.timing;
const { ballotDates } = panvala_utils.voting;

const now = timestamp();
const baseBallot = ballotDates(now - (durations.ONE_WEEK + 1));
const futureDeadlines = {
  GRANT: baseBallot.initialSlateSubmissionDeadline,
  GOVERNANCE: baseBallot.initialSlateSubmissionDeadline,
};
const ballot = {
  ...baseBallot,
  slateSubmissionDeadline: futureDeadlines,
};

const thePast = now - 1;
const expiredDeadlines = {
  GRANT: thePast,
  GOVERNANCE: thePast,
};

const expiredDeadlinesBallot = {
  ...baseBallot,
  slateSubmissionDeadline: expiredDeadlines,
};

storiesOf('Create Slate', module)
  .add('Create slate w/o staking', () => {
    return (
      <StoryWrapper ballot={ballot}>
        <NotificationsProvider>
          <Layout>
            <CreateSlate />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Create slate closed categories', () => {
    return (
      <StoryWrapper ballot={expiredDeadlinesBallot}>
        <NotificationsProvider>
          <Layout>
            <CreateSlate />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Governance slate', () => {
    return (
      <StoryWrapper ballot={ballot}>
        <NotificationsProvider>
          <Layout>
            <CreateGovernanceSlate />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Grant slate', () => {
    return (
      <StoryWrapper ballot={ballot}>
        <NotificationsProvider>
          <Layout>
            <CreateGrantSlate query={''} />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Closed submission -- grant', () => {
    return (
      <StoryWrapper ballot={expiredDeadlinesBallot}>
        <NotificationsProvider>
          <Layout>
            <CreateGrantSlate query={''} />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Closed submission -- governance', () => {
    return (
      <StoryWrapper ballot={expiredDeadlinesBallot}>
        <NotificationsProvider>
          <Layout>
            <CreateGovernanceSlate query={''} />
          </Layout>
        </NotificationsProvider>
      </StoryWrapper>
    );
  })
  .add('Closed submission message', () => {
    return <ClosedSlateSubmission category={'wacky'} deadline={thePast} />;
  });
