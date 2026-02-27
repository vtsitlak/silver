import * as jsonServer from 'json-server';
import { loginUser } from './auth.route';

const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, 'db.json'));

// Enable CORS
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

server.use(jsonServer.defaults());
server.use(jsonServer.bodyParser);

// Custom login route
server.route('/api/login').post(loginUser);

// Use json-server router for all other /api routes
server.use('/api', router);

const httpServer = server.listen(9000, () => {
    const addr = httpServer.address();
    const port = typeof addr === 'string' ? addr : addr?.port;
    console.log('HTTP REST API Server running at http://localhost:' + port);
});
