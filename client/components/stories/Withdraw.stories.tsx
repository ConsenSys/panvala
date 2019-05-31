import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Withdraw from '../../pages/Withdraw';
import EthereumProvider from '../EthereumProvider';
// import { ThemeProvider } from 'styled-components';
// import { theme } from '../../styles';
import MainProvider from '../MainProvider';
import Layout from '../Layout';

const AppContext = ({ children }: any) => (
  <EthereumProvider>
    <MainProvider>
      <Layout title="Panvala">{children}</Layout>
    </MainProvider>
  </EthereumProvider>
);

storiesOf('Withdraw', module)
  .add('Withdraw voting rights', () => {
    return (
      <AppContext>
        <>
          <Withdraw query={{ id: '0' }} asPath="voting" />;
        </>
      </AppContext>
    );
  })
  .add('Withdraw grant', () => {
    return (
      <AppContext>
        <>
          <Withdraw query={{ id: '0' }} asPath="grant" />;
        </>
      </AppContext>
    );
  })
  .add('Withdraw stake', () => {
    return (
      <AppContext>
        <>
          <Withdraw query={{ id: '0' }} asPath="stake" />;
        </>
      </AppContext>
    );
  });
