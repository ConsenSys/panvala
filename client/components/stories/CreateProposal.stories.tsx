import * as React from 'react';
import { storiesOf } from '@storybook/react';
import CreateProposal from '../../pages/proposals/create';
import MainProvider from '../MainProvider';
import Layout from '../Layout';

storiesOf('Create a Proposal', module).add('ProposalForm', () => {
  console.log('fdf');
  return (
    <MainProvider>
      <Layout>
        <CreateProposal />
      </Layout>
    </MainProvider>
  );
});
