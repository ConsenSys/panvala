import * as React from 'react';
import { render } from 'react-testing-library';
import Header from '../../components/Header';

describe('Header component', () => {
  test('should render correctly', () => {
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
  });
});
