import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Wallet from '../../pages/Wallet';
import EthereumProvider from '../EthereumProvider';
import MainProvider from '../MainProvider';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../styles';

const App = ({ children }: any) => (
  <EthereumProvider>
    <MainProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MainProvider>
  </EthereumProvider>
);

storiesOf('Wallet', module).add('Wallet', () => {
  return (
    <App>
      <Wallet />
    </App>
  );
});
