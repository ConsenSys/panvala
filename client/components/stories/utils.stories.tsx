import { ThemeProvider } from 'styled-components';
import keyBy from 'lodash/keyBy';
import EthereumProvider from '../EthereumProvider';
import { MainContext } from '../MainProvider';
import NotificationsProvider from '../NotificationsProvider';
import Layout from '../Layout';
import { theme } from '../../styles';
import { currentBallot } from './data';

export const StoryWrapper = ({ children, proposals, slates }: any) => {
  return (
    <EthereumProvider>
      <MainContext.Provider
        value={{
          proposals: !!proposals ? proposals : [],
          slates: !!slates ? slates : [],
          slatesByID: !!slates ? keyBy(slates, 'id') : {},
          proposalsByID: !!proposals ? keyBy(proposals, 'id') : {},
          currentBallot,
          onRefreshProposals: () => null,
          onRefreshSlates: () => null,
        }}
      >
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MainContext.Provider>
    </EthereumProvider>
  );
};

export const Wrapper = (props: any) => {
  return (
    <StoryWrapper {...props}>
      <NotificationsProvider>
        <Layout>{props.children}</Layout>
      </NotificationsProvider>
    </StoryWrapper>
  );
};
