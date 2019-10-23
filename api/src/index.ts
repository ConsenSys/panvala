import * as express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';

import { setupRoutes } from './routes';
import { listenAndSyncContractEvents } from './utils/events';

const app = express();

// Configuration and middleware:
const port = process.env.PORT || 5000;
// enable ALL CORS requests
// see: https://github.com/expressjs/cors#simple-usage-enable-all-cors-requests
app.use(cors({ credentials: true, origin: true }));
// enable parsing of JSON in POST request bodies
app.use(express.json());
// add logging
app.use(morgan('common'));

// Routes:
setupRoutes(app);

// Start server:
if (process.env.NODE_ENV !== 'test') {
  // Continuously listen for contract events
  listenAndSyncContractEvents();

  app.listen(port, () => console.log(`Starting server on port ${port}...`));
}

export default app;
