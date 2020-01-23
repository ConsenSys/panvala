import React from 'react';
import { ProfileLink, DonorList } from '.';
import Box from '../system/Box';
import DonateButton from '../DonateButton';

export function FunderBoard(props) {
  const { goal, firstName, profileLink, donations, onDonateClick } = props;
  const { donors, totalUsdCents } = donations;

  const numEntries = Object.keys(donors).length;

  // calculate number of people
  const anonymousDonations = donors['Anonymous'];
  let count = anonymousDonations == null ? numEntries : numEntries - 1 + anonymousDonations.length;

  const periodStart = 'December 1';
  const periodEnd = 'March 1';

  const totalDollars = totalUsdCents / 100;

  return (
    <>
      <Box p={'8vw'} flex column>
        <Box>
          ${totalDollars} of ${goal} goal by {periodEnd}
        </Box>
        {numEntries === 0 ? (
          <Box>No donations yet!</Box>
        ) : (
          <>
            <Box>
              Raised by {count} {count !== 1 ? 'people' : 'person'} since {periodStart}
            </Box>

            <DonorList donors={donors} />
          </>
        )}
        <DonateButton disabled={false} text="Donate" handleClick={onDonateClick} />

        <Box>Share {firstName}'s fundraiser link</Box>
        <ProfileLink href={profileLink} />
      </Box>
    </>
  );
}
