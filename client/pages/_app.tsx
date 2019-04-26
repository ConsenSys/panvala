import * as React from 'react';
import { toast } from 'react-toastify';
import App, { Container } from 'next/app';
import { SingletonRouter } from 'next/router';
import ErrorPage from 'next/error';
// required: import css at top-level
import '../reset.css';
import '../ReactToastify.css';
import '../components/Toggle.css';
import EthereumProvider from '../components/EthereumProvider';
import Layout, { AppContext } from '../components/Layout';

type IProps = {
  Component: any;
  router: SingletonRouter;
  ctx: any;
  account?: string;
  provider?: any;
  query?: any;
  pageProps: any;
};

interface IState {
  hasError: boolean;
  error?: Error;
  errorCode?: number;
}

export default class MyApp extends App<IProps, IState> {
  state: IState = {
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
    this.props.router.push('/', '/');
    console.log('CUSTOM ERROR', error);
    console.log('errorInfo:', errorInfo);
    toast.error(error.message);
    // this.setState({
    //   hasError: false
    // })

    // // TODO: log error to reporting service

    // // save logs in local storage
    // const persistedState = loadState();
    // const log = { error: error.message };
    // const newLogs = persistedState && persistedState.logs ? persistedState.logs.concat(log) : [log];
    // saveState({ logs: newLogs });
  }

  render() {
    const { Component, pageProps }: IProps = this.props;
    const { hasError, errorCode }: IState = this.state;

    return (
      <Container>
        <Layout title={pageProps.title || 'Panvala'}>
          {hasError && errorCode ? (
            <ErrorPage statusCode={errorCode} />
          ) : (
            <AppContext.Consumer>
              {({ onHandleNotification }) => (
                <EthereumProvider onHandleNotification={onHandleNotification}>
                  <Component {...pageProps} />
                </EthereumProvider>
              )}
            </AppContext.Consumer>
          )}
        </Layout>
      </Container>
    );
  }
}
