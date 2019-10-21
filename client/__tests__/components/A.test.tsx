import * as React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import A from '../../components/A';
import { theme } from '../../styles';

describe('A', () => {
  test('loads and displays greeting', async () => {
    const utils = render(
      <ThemeProvider theme={theme}>
        <A>TEST ANCHOR</A>
      </ThemeProvider>
    );
    const testA = utils.getByText('TEST ANCHOR');
    expect(testA).toBeTruthy();
  });
});
