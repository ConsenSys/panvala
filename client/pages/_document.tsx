import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

// see: https://nextjs.org/docs/#custom-document
// and: https://github.com/zeit/next.js/tree/master/examples/with-styled-components

// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const sheet: ServerStyleSheet = new ServerStyleSheet();
    const originalRenderPage: any = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: any) => (props: any) => sheet.collectStyles(<App {...props} />),
        });

      const initialProps: any = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <html>
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <link rel="icon" href="/static/favicon.ico" />
          {this.props.styles}
          <link rel="stylesheet" href="https://unpkg.com/tachyons@4.10.0/css/tachyons.min.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
