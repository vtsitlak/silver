/**
 * Vercel serverless proxy for Upstash (workouts).
 * Token is read from env (UPSTASH_URL, UPSTASH_TOKEN) — never in repo.
 * Local: run vercel dev from repo root; .env at repo root. Production: Vercel project env vars.
 * Kept in sync with repo root api/workouts.ts (GET list, GET by id, POST, DELETE).
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function missingEnv(): Response {
    return new Response(JSON.stringify({ error: 'UPSTASH_URL and UPSTASH_TOKEN must be set (e.g. in .env or Vercel)' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}

function jsonResponse(body: string, status: number, extraHeaders?: Record<string, string>): Response {
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders }
    });
}

export default {
    async fetch(request: Request): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const { method } = request;

        if (!UPSTASH_URL || !UPSTASH_TOKEN) {
            return missingEnv();
        }

        const headers: Record<string, string> = {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
        };

        const url = new URL(request.url);
        const pathParts = url.pathname.replace(/^\/+/, '').split('/');
        const isIdRoute = pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'workouts';
        const id = isIdRoute ? decodeURIComponent(pathParts[2]!) : null;

        try {
            if (isIdRoute && id) {
                if (method === 'GET') {
                    const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                    const data = await response.json();
                    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
                    const list = Array.isArray(parsed) ? parsed : [];
                    const workout = list.find((w: { id?: string }) => String(w?.id) === id) ?? null;
                    return jsonResponse(JSON.stringify(workout), 200);
                }
                if (method === 'DELETE') {
                    const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                    const data = await response.json();
                    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
                    const list = Array.isArray(parsed) ? parsed : [];
                    const filtered = list.filter((w: { id?: string }) => String(w?.id) !== id);
                    const setRes = await fetch(UPSTASH_URL, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(['JSON.SET', 'tabata_workouts', '$', JSON.stringify(filtered)])
                    });
                    const setData = await setRes.json();
                    if (setData.error) {
                        return jsonResponse(JSON.stringify({ error: setData.error }), 400);
                    }
                    return jsonResponse(JSON.stringify({ success: true }), 200);
                }
                return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
            }

            if (method === 'GET') {
                const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                const data = await response.json();
                const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
                return jsonResponse(JSON.stringify(Array.isArray(parsed) ? parsed : []), 200);
            }

            if (method === 'POST') {
                const body = await request.json();
                const response = await fetch(`${UPSTASH_URL}/JSON.ARRAPPEND/tabata_workouts/$`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (!response.ok) {
                    return jsonResponse(JSON.stringify({ error: data.error ?? 'Upstash error' }), response.status);
                }
                return jsonResponse(JSON.stringify({ success: true }), 201);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
