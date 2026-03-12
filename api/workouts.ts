/**
 * Vercel serverless proxy for Upstash (workouts).
 * Token is read from env (UPSTASH_URL, UPSTASH_TOKEN) — never in repo.
 * CORS allows localhost (e.g. local dev) to call this deployed API.
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
        const pathId = pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'workouts' ? decodeURIComponent(pathParts[2]!) : null;
        const queryId = url.searchParams.get('id');
        const id = pathId ?? queryId;
        const isIdRoute = id != null && id !== '';

        try {
            if (isIdRoute) {
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
                const list = Array.isArray(parsed) ? parsed : [];
                const searchRaw = url.searchParams.get('search');
                const search = typeof searchRaw === 'string' ? searchRaw.trim() : '';
                const filtered =
                    search.length > 0
                        ? list.filter((w: Record<string, unknown>) => {
                              const name = typeof w?.name === 'string' ? w.name.toLowerCase() : '';
                              const description = typeof w?.description === 'string' ? w.description.toLowerCase() : '';
                              const id = typeof w?.id === 'string' ? w.id.toLowerCase() : String(w?.id ?? '').toLowerCase();
                              const term = search.toLowerCase();
                              return name.includes(term) || description.includes(term) || id.includes(term);
                          })
                        : list;
                return jsonResponse(JSON.stringify(filtered), 200);
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
