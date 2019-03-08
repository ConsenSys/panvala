const withTypescript = require('@zeit/next-typescript');
const withCSS = require('@zeit/next-css');

module.exports = withTypescript(
  withCSS({
    publicRuntimeConfig: {
      apiHost: process.env.API_HOST,
      gatekeeperAddress: process.env.GATEKEEPER_ADDRESS,
      tokenCapacitorAddress: process.env.TOKEN_CAPACITOR_ADDRESS,
    },
    // cssModules: true,
    // cssLoaderOptions: {
    //   importLoaders: 1,
    //   localIdentName: '[local]___[hash:base64:5]',
    // },
    // https://github.com/zeit/next.js#disabling-file-system-routing
    // useFileSystemPublicRoutes: false,
  })
);
