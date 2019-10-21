import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Actions from '../../components/Actions';

const handleClick = jest.fn();

describe('Actions', () => {
  test('loads and displays greeting', async () => {
    const utils = render(<Actions handleClick={handleClick} actionText="TEST BUTTON" />);
    const button = utils.getByText('TEST BUTTON');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
