import React from 'react';
import Box from './system/Box';

const BudgetBar = ({ budgetText, panValue, usdValue }) => {
  return (
    <Box
      py={['1rem', '2rem']}
      px={['1rem', '3.5rem']}
      mt={['-60px', '-120px', '-120px', '-100px']}
      mx={['3rem', '6rem', '9rem']}
      boxShadow="0px 0px 40px rgba(0, 0, 0, 0.2)"
      borderRadius="12px"
      position="relative"
      bg="white"
      zIndex={800}
    >
      <Box flex justifyContent="space-between" alignItems="center">
        <Box fontSize={['1.1rem', '1.3rem', '1.4rem']} bold>
          {budgetText}
        </Box>
        <Box flex column alignItems="flex-end">
          <Box textAlign="right" fontSize={['1rem', '1.1rem', '1.3rem']} bold color="blues.medium">
            {panValue || 'Loading...'}
          </Box>
          <Box textAlign="right" color="blues.light" fontSize="1.1rem">
            {usdValue}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BudgetBar;
