import React from 'react';
import BudgetProvider from './src/components/BudgetProvider';

// see: https://www.gatsbyjs.org/docs/ssr-apis/#wrapRootElement
export const wrapRootElement = ({ element }) => {
  return <BudgetProvider>{element}</BudgetProvider>;
};
