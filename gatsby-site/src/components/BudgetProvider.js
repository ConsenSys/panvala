import React, { useState, useEffect } from 'react';
import { getBudgets } from '../utils/api';
import { prettify } from '../utils/format';

// const initialState = {};
const initialState = {
  budgets: { epochPAN: '', epochUSD: '', annualPAN: '', annualUSD: '', epochNumber: undefined },
};
export const BudgetContext = React.createContext(initialState);

const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState(initialState);

  useEffect(() => {
    async function getData() {
      const budgets = await getBudgets();

      if (!budgets.errors) {
        const formatted = {
          epochPAN: `${prettify(budgets.epochBudgetPAN)} PAN`,
          epochUSD: `($${prettify(budgets.epochBudgetUSD)} USD)`,
          annualPAN: `${prettify(budgets.annualBudgetPAN)} PAN`,
          annualUSD: `($${prettify(budgets.annualBudgetUSD)} USD)`,
          epochNumber: budgets.epochNumber,
        };
        console.log('formatted:', formatted);

        setBudgets(formatted);
      }
    }

    getData();
  }, []);

  return <BudgetContext.Provider value={{ budgets }}>{children}</BudgetContext.Provider>;
};

export default React.memo(BudgetProvider);
