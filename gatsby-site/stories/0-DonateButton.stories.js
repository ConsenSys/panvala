import React from 'react';
import DonateButton from '../src/components/DonateButton';

export default {
  title: 'DonateButton',
};

function action(action) {
  console.log('action', action);
}

export const click = () => <DonateButton handleClick={action} />;
