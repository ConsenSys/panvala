import React, { useEffect, useState, useRef } from 'react';

import SEO from '../components/seo';
import Layout from '../components/Layout';
import {
  FundraiserProfile,
  FundraiserHeader,
  FundraiserOverview,
  FunderBoard,
} from '../components/Fundraiser';
import Box from '../components/system/Box';
import FundraiserDonation from '../components/Fundraiser/FundraiserDonation';

import { getFundraiserDonations } from '../utils/api';

const Fundraiser = props => {
  console.log('Fundraiser props:', props);

  const profileInfo = props.pageContext;
  const { fetchDonations } = props;
  const { slug: fundraiser } = profileInfo;

  const [donations, setDonations] = useState({ totalUsdCents: '0', donors: {} });
  const donateRef = useRef(null);

  function onDonateClick() {
    donateRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  useEffect(() => {
    // fetch the donation data from the API
    async function getData(fundraiser) {
      if (fundraiser === '') {
        console.log('no fundraiser set');
        return;
      }

      console.log('fetching data for', fundraiser);
      try {
        const data = await getFundraiserDonations(fundraiser);
        setDonations(data);
      } catch (error) {
        console.error(`Problem fetching donation data: ${error}`);
      }
    }

    // Use the default fetching function if no function was passed in
    if (fetchDonations == null) {
      if (fundraiser !== '') {
        getData(fundraiser);
      }
    } else {
      // Use the passed in function (for storybook)
      const data = fetchDonations(fundraiser);
      console.log('fetched', data);
      setDonations(data);
    }
  }, [fetchDonations, fundraiser]);

  return (
    <Layout>
      <SEO title="Fundraiser" />

      <FundraiserHeader />

      <Box mt="-5vw" className="bottom-clip-down relative z-3" bg="white" height="1000px">
        <Box flex>
          <FundraiserProfile {...profileInfo} />
          <FunderBoard
            profileLink={props.location.href}
            {...profileInfo}
            donations={donations}
            onDonateClick={onDonateClick}
          />
        </Box>
      </Box>

      <FundraiserOverview {...profileInfo} />

      <Box mt="-5vw" className="relative z-2" height="1000px">
        <Box p={'10vw'} ref={donateRef}>
          <FundraiserDonation fundraiser={fundraiser} />
        </Box>
      </Box>
    </Layout>
  );
};

// This populates the `data` prop

// import { graphql } from 'gatsby';

// export const query = graphql`
//   query($id: String) {
//     fundraisersJson(id: { eq: $id }) {
//       id
//       firstName
//       lastName
//       story
//       teamInfo
//     }
//   }
// `;

export default Fundraiser;
