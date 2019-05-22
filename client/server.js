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

  server.get('/slates/create', (req, res) => {
    // NOTE: in order to do this, change the RouterLink asPath to `/slates/create/${proposal.id}`
    // proposal id (if refreshing after coming from 'Add To Slate')
    const requestParams = setIdParamsByRequestQuery(req);
    return app.render(req, res, '/slates/create', requestParams);
  });
  server.get('/proposals/create', (req, res) => app.render(req, res, '/proposals/create'));

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
