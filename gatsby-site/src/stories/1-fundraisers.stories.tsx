import * as React from 'react';
import {
  FundraiserForm,
  FundraiserHeader,
  FundraiserProfile,
  ProfileCopy,
  ProfileLink,
  FundraiserOverview,
  FunderBoard,
  DonorList,
} from '../components/Fundraiser';
import Fundraiser from '../templates/Fundraiser';
import { ReasonToContribute } from '../components/Fundraiser/FundraiserOverview';
import flag from '../img/fundraisers/flag.png';
import Layout from '../components/Layout';

export default {
  title: 'Fundraisers',
};

const profileProps = {
  firstName: 'First',
  lastName: 'Last',
  story:
    'Fundraiser story Fundraiser story Fundraiser story Fundraiser story Fundraiser story Fundraiser story Fundraiser story Fundraiser story ',
  goal: 1000,
  team: {
    name: 'Team',
    description: 'Team information Team information Team information Team information Team information Team information Team information Team information',
  },
  slug: 'first-last',
  image: { publicURL: 'https://example.com/image.png' }
};

const link = 'https://example.com/link';
const location = { href: link };

const donationStats = {
  totalUsdCents: '45000',
  donors: {
    'Mary Eckert': [{ usdValueCents: '20000', timestamp: '2020-01-08T20:44:30.354Z' }],
    'Nicky Stevens': [{ usdValueCents: '10000', timestamp: '2020-01-08T20:44:30.355Z' }],
    'David West': [
      { usdValueCents: '2500', timestamp: '2020-01-08T20:44:30.356Z' },
      { usdValueCents: '2500', timestamp: '2020-01-08T20:44:30.358Z' },
    ],
    Anonymous: [
      { usdValueCents: '2500', timestamp: '2020-01-08T20:44:30.356Z' },
      { usdValueCents: '5000', timestamp: '2020-01-08T20:44:30.357Z' },
    ],
    John: [{ usdValueCents: '2500', timestamp: '2020-01-08T20:44:30.357Z' }],
  },
};

const emptyDonationStats = { totalUsdCents: '0', donors: {} };

export const header = () => <FundraiserHeader />;

export const profileCopy = () => <ProfileCopy {...profileProps} />;
export const profile = () => <FundraiserProfile {...profileProps} />;
export const donorList = () => <DonorList  donors={donationStats.donors} />;
export const funderBoard = () => <FunderBoard profileLink={link} {...profileProps} donations={donationStats}/>;
export const emptyFunderBoard = () => (
  <FunderBoard profileLink={link} {...profileProps} donations={emptyDonationStats} />
);
export const profileLink = () => <ProfileLink href={link} />;

export const reasonToContribute = () => (
  <ReasonToContribute iconSrc={flag} title="Prioritized Grants">
    When you donate to Vivek Singh’s fundraiser, the Gitcoin team moves up Panvala’s leaderboard for
    grant application priority. View the leaderboard.
  </ReasonToContribute>
);

export const overview = () => <FundraiserOverview {...profileProps} />;
export const form = () => (
  <Layout>
    <FundraiserForm onSubmit={() => {
      console.log('submit');
    }} />
  </Layout>
);

const pageProps = {
  pageContext: profileProps,
  location,
  fetchDonations: () => {
    console.log('story: fetching data for', profileProps.slug);
    return donationStats;
  }
}
export const fullPage = () => <Fundraiser {...pageProps} />;
export const fullPageNoDonations = () => (
  <Fundraiser {...pageProps} fetchDonations={() => emptyDonationStats} />
);
