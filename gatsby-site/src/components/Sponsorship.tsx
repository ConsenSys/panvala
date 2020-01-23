import React from 'react';

import WebsiteModal from './WebsiteModal';
import SponsorshipForm from './SponsorshipForm';
import Box from './system/Box';

import { withDonationFlow, IDonationFlowData } from './donationFlow';

interface Props {
  ethPrices: any;
  step: number | null;
  message: string;
  onCancel: any;
  onDonate: any;
}

const Sponsorship = (props: Props) => {
  // Click handler for donations
  async function handleDonation(values, actions) {
    console.log('Sponsorship:', 'handleDonation', values);

    const { company, firstName, lastName, email, pledgeAmount, pledgeDuration } = values;

    // Data needed for the donation flow
    const data: IDonationFlowData = {
      userData: { firstName, lastName, email, company },
      donationMetadata: {
        monthlyPledge: pledgeAmount,
        pledgeDuration,
        memo: `Sponsorship: ${company}`,
      },
      pledgeType: 'sponsorship',
      donationTier: 'Sponsor',
    };

    try {
      await props.onDonate(data, actions);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <Box data-testid="sponsorship-container">
      <SponsorshipForm onSubmit={handleDonation} />
      <WebsiteModal
        isOpen={true}
        step={props.step}
        message={props.message}
        handleCancel={props.onCancel}
        pledgeType="sponsorship"
      />
    </Box>
  );
};

const PoweredSponsorship = withDonationFlow(Sponsorship);
export default PoweredSponsorship;
