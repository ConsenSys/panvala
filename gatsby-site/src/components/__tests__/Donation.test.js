import React from 'react';
import Donation from '../Donation';
import { create } from 'react-test-renderer';

describe('Donation', () => {
  let component, instance;

  beforeEach(() => {
    component = create(<Donation />);
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

    console.log("instance:", instance);

    expect(component.toJSON()).toMatchSnapshot();
    expect(instance.state).toEqual(initialState);
  });
});
