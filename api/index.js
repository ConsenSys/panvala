const express = require('express');
const cors = require('cors');
const setupRoutes = require('./routes');

const app = express();

// Configuration and middleware:
const port = process.env.PORT || 5000;
// enable ALL CORS requests
// see: https://github.com/expressjs/cors#simple-usage-enable-all-cors-requests
app.use(cors({ credentials: true, origin: true }));
// enable parsing of JSON in POST request bodies
app.use(express.json());

// Routes:
setupRoutes(app);

// Start server:
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Starting server on port ${port}...`));
}

module.exports = app;
