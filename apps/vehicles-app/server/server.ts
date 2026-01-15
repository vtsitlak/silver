import express, { Application } from 'express';
import { getAll, getByFilter } from './get-vehicles.route';

const bodyParser = require('body-parser');
const app: Application = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

// Log all requests
app.use('/api/vehicles', (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/vehicles', (req, res) => getAll(res));
app.post('/api/vehicles', getByFilter);

const httpServer = app.listen(9000, () => {
    const addr = httpServer.address();
    // address() can return a string (pipe/UNIX socket) or AddressInfo; guard accordingly
    const port = typeof addr === 'string' ? addr : addr?.port;
    console.log(`HTTP REST API Server running at http://localhost:${port}`);
});




