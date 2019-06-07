import Router from 'next/router';
import { utils } from 'ethers';
import { ballotDates } from '../../utils/status';
import { ISlate, IProposal } from '../../interfaces';
import '../../globalStyles.css';

// https://github.com/zeit/next.js/issues/1827#issuecomment-323314141
(Router as any).router = {
  push: () => {},
  prefetch: () => {},
};

export const epochStartDate = 1549040401;
export const currentBallot = ballotDates(epochStartDate);

export const proposals: IProposal[] = [
  {
    id: 0,
    firstName: 'Amanda',
    lastName: 'Crypto',
    title: 'A great project',
    tokensRequested: '5000000000',
    summary:
      "Plasma is a family of protocols which allow individuals to easily deploy high-throughput, secure blockchains. A smart contract on Ethereum’s main chain can ensure that users’ funds are secure, even if the “plasma chain” acts fully maliciously. This eliminates the need for a trusted pegging mechanism like that of sidechains. Plasma chains are non-custodial, allowing the prioritization of scalability without sacrificing security. We’ve devised a new architecture for building Plasma apps on one generalized plasma chain. It establishes a clean separation between the plasma layer and the application layer. We will publish a generalized Plasma predicate contract framework, which allows for upgradeability and composability of plasma contracts. Since plasma research moves so quickly, we realized we needed to develop an architecture that allowed for maximal modularity, to prevent vast chunks of code from being thrown away with each new research discovery. With that framework, we will refactor our existing codebase for secure payments using predicates. We want to use the generalized Plasma research we did and put it to the test in our codebase refactor following the launch of our testnet on January 31. Dogfooding is a critical part of the work we do, as there's no point to open sourcing the codebase if it's not readable or easy to use.",
    awardAddress: '0xd115bffabbdd893a6f7cea402e7338643ced44a6',
    projectTimeline: 'timeline',
    teamBackgrounds: 'backgrounds',
  },
];

export const unstakedSlate: ISlate = {
  id: 0,
  category: 'GRANT',
  status: 0,
  deadline: currentBallot.votingOpenDate,
  title: 'Some slate',
  owner: 'John Doe',
  recommenderAddress: '0xd115bffabbdd893a6f7cea402e7338643ced44a6',
  organization: 'Team Recommender',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eu nibh molestie, auctor ligula a, faucibus ante. Morbi dapibus enim in vulputate congue. Mauris feugiat gravida nibh, sed pellentesque eros pellentesque eu. Sed rutrum vitae magna sed aliquet. Suspendisse facilisis vulputate lobortis. Vestibulum sed dolor eu mi molestie pharetra. Duis ut diam aliquam, molestie erat non, scelerisque ligula. Curabitur accumsan ipsum pellentesque posuere ornare. Sed vulputate cursus accumsan. Morbi efficitur dictum magna, a imperdiet mauris aliquet vitae.',
  proposals,
  requiredStake: utils.bigNumberify('300000000000000000000'),
  verifiedRecommender: false,
};
