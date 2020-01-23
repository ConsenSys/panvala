import React from 'react';

import { FundraiserForm } from './FundraiserForm';
import { withDonationFlow, IDonationFlowData } from '../donationFlow';
import WebsiteModal from '../WebsiteModal';

const FundraiserDonation = props => {
  async function handleDonation(values, actions) {
    const { firstName, lastName, email, pledgeAmount, message } = values;

    // Data needed for the donation flow
    const data: IDonationFlowData = {
      userData: { firstName, lastName, email },
      donationMetadata: { monthlyPledge: pledgeAmount, pledgeDuration: '1', memo: '' },
      extraData: { fundraiser: props.fundraiser, message },
      pledgeType: 'donation',
      // modal message: "You are now a Patron"
      donationTier: '',
    };

    try {
      await props.onDonate(data, actions);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <>
      <FundraiserForm onSubmit={handleDonation} />

      <WebsiteModal
        isOpen={true}
        step={props.step}
        message={props.message}
        handleCancel={props.onCancel}
      />
    </>
  );
};

const poweredFundraiserDonation = withDonationFlow(FundraiserDonation);
export default poweredFundraiserDonation;
