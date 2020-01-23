import React from 'react';
import Box from '../system/Box';

function calculateTotal(donations) {
  return donations.reduce((prev, current) => {
    return prev + parseInt(current.usdValueCents);
  }, 0);
}

export const DonorList = props => {
  const { donors } = props;

  const knownDonors = Object.keys(donors).filter(d => d !== 'Anonymous');
  const anonymousDonors = donors['Anonymous'] || [];

  // display known donors aggregated, then individual anonymous donations
  return (
    <Box flex column>
      {knownDonors.map((key, i) => {
        const totalUsdCents = calculateTotal(donors[key]);
        return (
          <Box key={key}>
            {key} - ${totalUsdCents / 100}
          </Box>
        );
      })}

      {anonymousDonors.map((donation, i) => {
        return <Box key={i}>Anonymous - ${donation.usdValueCents / 100}</Box>;
      })}
    </Box>
  );
};
