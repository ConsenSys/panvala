import * as React from 'react';
import styled from 'styled-components';
import Head from 'next/head';
import { space } from 'styled-system';

import Header from './Header';

export const LayoutWrapper: any = styled.div`
  font-family: 'Roboto';
  box-sizing: border-box;
  min-height: 100vh;
  margin: 2em 10em;
  ${space};
`;

export default ({ title, children }: any) => (
  <LayoutWrapper mx={['1em', '1.5em', '2em', '10em']} my={['1em', '1.5em', '2em']}>
    <Head>
      <title>{title}</title>
    </Head>
    <Header />
    {children}
  </LayoutWrapper>
);
