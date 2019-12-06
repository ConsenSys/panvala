import React from 'react';
import { create } from 'react-test-renderer';
import Sponsorship from '../Sponsorship';

describe('Donation', () => {
  let component, instance;

  beforeEach(() => {
    component = create(<Sponsorship />);
    instance = component.getInstance();
  });

  test('should render component and initialize with correct state', () => {
    const initialState = {
      email: '',
      fullName: '',
      selectedAccount: '',
      step: null,
      error: false,
      message: '',
      tier: '',
      panPurchased: 0,
    };

    expect(component.toJSON()).toMatchSnapshot();
    expect(instance.state).toEqual(initialState);
  });
});
