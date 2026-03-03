/**
 * Local dev proxy for /api/workouts. Run from repo root:
 *   node apps/tabata-ai/scripts/local-workouts-api.cjs
 * Then run: nx serve tabata-ai
 * Uses .env (UPSTASH_URL, UPSTASH_TOKEN) from repo root or apps/tabata-ai. Git-ignored.
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../../..'); // repo root when script is in apps/tabata-ai/scripts
const ENV_PATHS = [
    path.join(ROOT, '.env'),           // repo root
    path.join(__dirname, '../.env')    // apps/tabata-ai/.env
];
const PORT = 3100;

function loadEnv() {
    const env = {};
    for (const envPath of ENV_PATHS) {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split(/\n/)) {
                const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
                if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
            }
            break;
        }
    }
    return env;
}

const env = loadEnv();
const UPSTASH_URL = env.UPSTASH_URL || process.env.UPSTASH_URL;
const UPSTASH_TOKEN = env.UPSTASH_TOKEN || process.env.UPSTASH_TOKEN;

const envHint = `Create a file named .env at the repo root (${ROOT}) with:
UPSTASH_URL=https://your-upstash-url
UPSTASH_TOKEN=your_token
(See .env.example.)`;

function missingEnv(res) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'UPSTASH_URL and UPSTASH_TOKEN required.', hint: envHint }));
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url !== '/api/workouts' && !req.url.startsWith('/api/workouts/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
    }

    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        missingEnv(res);
        return;
    }

    const headers = {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        if (req.method === 'GET' && (req.url === '/api/workouts' || req.url === '/api/workouts/')) {
            const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
            const data = await response.json();
            const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result ?? [];
            const list = Array.isArray(parsed) ? parsed : [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(list));
            return;
        }
        if (req.method === 'POST' && req.url === '/api/workouts') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
            const response = await fetch(`${UPSTASH_URL}/JSON.ARRAPPEND/tabata_workouts/$`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                res.writeHead(response.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: data.error || 'Upstash error' }));
                return;
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
});

server.listen(PORT, () => {
    console.log(`Local workouts API: http://localhost:${PORT}/api/workouts`);
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        console.warn('UPSTASH_URL or UPSTASH_TOKEN missing.');
        console.warn(envHint);
    }
});
