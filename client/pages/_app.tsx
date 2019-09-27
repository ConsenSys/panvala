import * as React from 'react';
import App, { Container } from 'next/app';
import ErrorPage from 'next/error';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles';
import '../globalStyles.css';
import '../ReactToastify.css';
import Layout from '../components/Layout';
import MainProvider from '../components/MainProvider';
import EthereumProvider from '../components/EthereumProvider';
import NotificationsProvider from '../components/NotificationsProvider';

interface IProps {
  Component: any;
  ctx: any;
  pageProps?: any;
}

interface IState {
  hasError: boolean;
  error?: Error;
  errorCode?: number;
}

export default class MyApp extends App<IProps, IState> {
  readonly state: IState = {
    hasError: false,
  };

  // For the initial page load, getInitialProps will execute on the server only.
  // getInitialProps will only be executed on the client when navigating to a
  // different route via the Link component or using the routing APIs.
  // https://github.com/zeit/next.js#fetching-data-and-component-lifecycle
  static async getInitialProps({ Component, ctx }: IProps) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }

  // this sets state with the error so the next render will show fallback UI
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('CUSTOM ERROR', error);
    console.log('errorInfo:', errorInfo);
    // TODO: log error to reporting service
  }

  render() {
    const { Component, pageProps }: IProps = this.props;
    const { hasError, errorCode }: IState = this.state;

    if (hasError && errorCode) {
      return <ErrorPage statusCode={errorCode} />;
    }

    // If this is a liveness check, do not render the full context. We just want to check that
    // the application is running.
    if (typeof pageProps.asPath !== 'undefined' && pageProps.asPath.startsWith('/liveness')) {
      return <Component {...pageProps} />;
    }

    return (
      <Container>
        <EthereumProvider>
          <MainProvider>
            <NotificationsProvider>
              <ThemeProvider theme={theme}>
                <Layout title={pageProps.title || 'Panvala Disputes'}>
                  <Component {...pageProps} />
                </Layout>
              </ThemeProvider>
            </NotificationsProvider>
          </MainProvider>
        </EthereumProvider>
        <ToastContainer
          position="bottom-right"
          autoClose={8000}
          hideProgressBar={true}
          newestOnTop={false}
          rtl={false}
          draggable={false}
          closeOnClick
          pauseOnHover
        />
      </Container>
    );
  }
}
