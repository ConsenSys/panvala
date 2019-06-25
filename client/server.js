const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

function setIdParamsByRequestQuery(req) {
  return Object.assign(
    {
      id: req.params.id,
    },
    req.query
  );
}

app.prepare().then(() => {
  // init express server (frontend)
  const server = express();

  // if (!dev) {
  //   server.use(function(req, res, goOn) {
  //     if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
  //       res.redirect('https://' + req.get('Host') + req.url);
  //     } else goOn();
  //   });
  // }

  // redirect root index to /slates
  server.get('/', (req, res) => res.redirect(301, '/slates'));

  // ----------------------------------------------
  // FORMS / TRANSACTIONS
  // ----------------------------------------------

  server.get('/slates/create', (req, res) => app.render(req, res, '/slates/create'));
  server.get('/slates/create/grant/:id', (req, res) => {
    // this is to handle query params: proposalID (coming from /proposals/:id)
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/slates/create/grant', requestParams);
  });
  // prettier-ignore
  server.get('/slates/create/governance', (req, res) => app.render(req, res, '/slates/create/governance'));

  server.get('/proposals/create', (req, res) => app.render(req, res, '/proposals/create'));

  server.get('/wallet', (req, res) => app.render(req, res, '/Wallet'));
  server.get('/donate', (req, res) => app.render(req, res, '/Donate'));

  // ----------------------------------------------
  // SLATE STAKING
  // ----------------------------------------------

  server.get('/slates/:id/stake', (req, res) => {
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/slates/stake', requestParams);
  });
  server.get('/withdraw/stake/:id', (req, res) => {
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/Withdraw', requestParams);
  });
  server.get('/withdraw/grant/:id', (req, res) => {
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/Withdraw', requestParams);
  });
  server.get('/withdraw/voting', (req, res) => {
    return app.render(req, res, '/Withdraw');
  });

  // ----------------------------------------------
  // INDIVIDUAL SLATE or PROPOSAL
  // ----------------------------------------------

  // pass the id param inside the request
  server.get('/slates/:id', (req, res) => {
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/slates/slate', requestParams);
  });
  server.get('/proposals/:id', (req, res) => {
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/proposals/proposal', requestParams);
  });

  // ----------------------------------------------
  // HOUSEKEEPING
  // ----------------------------------------------

  // handle any null request
  server.get('/*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
