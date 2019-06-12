import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Card from '../Card';
import { StoryWrapper } from './utils.stories';
import { ballotDates, convertEVMSlateStatus } from '../../utils/status';
import { utils } from 'ethers';
import { GRANT_SLATE } from '../../utils/constants';

const currentBallot = ballotDates(1549040401);
const slate = {
  id: 0,
  title: 'Some slate',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eu nibh molestie, auctor ligula a, faucibus ante. Morbi dapibus enim in vulputate congue. Mauris feugiat gravida nibh, sed pellentesque eros pellentesque eu. Sed rutrum vitae magna sed aliquet. Suspendisse facilisis vulputate lobortis. Vestibulum sed dolor eu mi molestie pharetra. Duis ut diam aliquam, molestie erat non, scelerisque ligula. Curabitur accumsan ipsum pellentesque posuere ornare. Sed vulputate cursus accumsan. Morbi efficitur dictum magna, a imperdiet mauris aliquet vitae.',
  proposals: [],
  category: 'GRANT',
  status: 0,
  deadline: currentBallot.votingOpenDate,
  owner: 'John Doe',
  recommenderAddress: '0xd115bffabbdd893a6f7cea402e7338643ced44a6',
  organization: 'Team Recommender',
  requiredStake: utils.bigNumberify('300000000000000000000'),
};

storiesOf('Card', module)
  .add('unverified nonincumbent', () => {
    const newSlate = {
      ...slate,
      verifiedRecommender: false,
      incumbent: false,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          title={newSlate.title}
          subtitle={newSlate.proposals && newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommenderAddress}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={GRANT_SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('verified nonincumbent', () => {
    const newSlate = {
      ...slate,
      verifiedRecommender: true,
      incumbent: false,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          title={newSlate.title}
          subtitle={newSlate.proposals && newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommenderAddress}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={GRANT_SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('unverified incumbent', () => {
    const newSlate = {
      ...slate,
      verifiedRecommender: false,
      incumbent: true,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          title={newSlate.title}
          subtitle={newSlate.proposals && newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommenderAddress}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={GRANT_SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  })
  .add('verified incumbent', () => {
    const newSlate = {
      ...slate,
      verifiedRecommender: true,
      incumbent: true,
    };
    return (
      <StoryWrapper>
        <Card
          key={newSlate.id}
          title={newSlate.title}
          subtitle={newSlate.proposals && newSlate.proposals.length + ' Grants Included'}
          description={newSlate.description}
          category={newSlate.category}
          status={convertEVMSlateStatus(newSlate.status)}
          address={newSlate.recommenderAddress}
          recommender={newSlate.organization}
          verifiedRecommender={newSlate.verifiedRecommender}
          type={GRANT_SLATE}
          incumbent={newSlate.incumbent}
        />
      </StoryWrapper>
    );
  });
