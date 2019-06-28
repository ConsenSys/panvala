import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Card from '../Card';
import { StoryWrapper } from './utils.stories';
import { convertEVMSlateStatus } from '../../utils/status';
import { SLATE, PROPOSAL } from '../../utils/constants';
import { unstakedSlate, proposals } from './data';

storiesOf('Card', module)
  .add('unverified nonincumbent', () => {
    const newSlate = {
      ...unstakedSlate,
      verifiedRecommender: false,
      incumbent: false,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          subtitle={newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommender}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('verified nonincumbent', () => {
    const newSlate = {
      ...unstakedSlate,
      verifiedRecommender: true,
      incumbent: false,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          subtitle={newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommender}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('unverified incumbent', () => {
    const newSlate = {
      ...unstakedSlate,
      verifiedRecommender: false,
      incumbent: true,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          subtitle={newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommender}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('verified incumbent', () => {
    const newSlate = {
      ...unstakedSlate,
      verifiedRecommender: true,
      incumbent: true,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          subtitle={newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommender}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('governance slate', () => {
    const newSlate = {
      ...unstakedSlate,
      verifiedRecommender: true,
      incumbent: true,
      proposals: [],
      category: 'GOVERNANCE',
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          subtitle={
            newSlate.proposals.length > 0 ? newSlate.proposals.length + ' Grants Included' : ''
          }
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommender}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('proposal', () => {
    const proposal = {
      ...proposals[0],
    };
    return (
      <StoryWrapper>
        <Card
          title={proposal.title}
          subtitle={proposal.tokensRequested + ' Tokens Requested'}
          description={proposal.summary}
          category={`${proposal.category} PROPOSAL`}
          type={PROPOSAL}
        />
      </StoryWrapper>
    );
  });
