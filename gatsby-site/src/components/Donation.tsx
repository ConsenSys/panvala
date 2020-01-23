import React from 'react';

import WebsiteModal from './WebsiteModal';
import DonationForm from './DonationForm';
import Box from './system/Box';

import { getTier } from '../utils/donate';
import { withDonationFlow, IDonationFlowData } from './donationFlow';

interface Props {
  ethPrices: any;
  step: number | null;
  message: string;
  onCancel: any;
  onDonate: any;
}

const Donation = (props: Props) => {
  // Click handler for donations
  async function handleDonation(values, actions) {
    console.log('Donation:', 'handleDonation', values);

    const { firstName, lastName, email, monthlyPledge, pledgeDuration } = values;

    // Data needed for the donation flow
    const data: IDonationFlowData = {
      userData: { firstName, lastName, email },
      donationMetadata: { monthlyPledge, pledgeDuration, memo: '' },
      pledgeType: 'donation',
      donationTier: getTier(monthlyPledge),
    };

    try {
      await props.onDonate(data, actions);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <Box data-testid="donation-container">
      <DonationForm onSubmit={handleDonation} ethPrices={props.ethPrices} />
      <WebsiteModal
        isOpen={true}
        step={props.step}
        message={props.message}
        handleCancel={props.onCancel}
      />
    </Box>
  );
};

const PoweredDonation = withDonationFlow(Donation);
export default PoweredDonation;
