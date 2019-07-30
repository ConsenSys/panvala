const withTypescript = require('@zeit/next-typescript');
const withCSS = require('@zeit/next-css');

module.exports = withTypescript(
  withCSS({
    publicRuntimeConfig: {
      apiHost: process.env.API_HOST,
      gatekeeperAddress: process.env.GATEKEEPER_ADDRESS,
      tokenCapacitorAddress: process.env.TOKEN_CAPACITOR_ADDRESS,
      panvalaEnv: process.env.PANVALA_ENV,
    },
    // https://github.com/zeit/next.js#disabling-file-system-routing
    // useFileSystemPublicRoutes: false,
  })
);
