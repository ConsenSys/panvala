import React from 'react';
import Box from '../system/Box';

export function ProfileCopy({ firstName, lastName, story, team }) {
  const teamDescription = `${firstName} is fundraising for the ${team.name} team. ${team.description}`;

  return (
    <>
      <Box flex column maxWidth={'500px'}>
        <Box fontSize={4} bold mb={4}>
          {`${firstName} ${lastName}`}
        </Box>
        <Box bold mb={4}>
          {`"${story}"`}
        </Box>
        <Box>{teamDescription}</Box>
      </Box>
    </>
  );
}
