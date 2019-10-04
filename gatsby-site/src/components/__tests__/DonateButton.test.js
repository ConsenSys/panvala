import React from 'react';
import DonateButton from '../DonateButton';
import { create } from 'react-test-renderer';

describe('DonateButton', () => {
  const clickHandler = jest.fn();

  test('should render component', () => {
    // Test render
    const component = create(<DonateButton handleClick={clickHandler} />);
    const instance = component.root;

    // Get input (submit button) element
    const button = instance.findByType('input')

    // Mock: click button
    button.props.onClick();
    expect(clickHandler).toHaveBeenCalled();

    // Snapshot
    expect(component.toJSON()).toMatchSnapshot();
  });
});
