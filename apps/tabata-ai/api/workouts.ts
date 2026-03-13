/**
 * Vercel serverless proxy for Upstash (workouts).
 * Token is read from env (UPSTASH_URL, UPSTASH_TOKEN) — never in repo.
 * Local: run vercel dev from repo root; .env at repo root. Production: Vercel project env vars.
 * Kept in sync with repo root api/workouts.ts (GET list, GET by id, POST, PUT, DELETE).
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
function generateWorkoutId(): string {
    const randomPart = Array.from({ length: 6 }, () => ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]).join('');
    return `${Date.now()}${randomPart}`;
}

function timestamp(): string {
    const d = new Date();
    const y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${M}-${D}-${h}:${m}:${s}`;
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
                if (method === 'PUT') {
                    const body = await request.json();
                    const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                    const data = await response.json();
                    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
                    const list = Array.isArray(parsed) ? parsed : [];
                    const index = list.findIndex((w: { id?: string }) => String(w?.id) === id);
                    if (index === -1) {
                        return jsonResponse(JSON.stringify({ error: 'Workout not found' }), 404);
                    }
                    const existing = list[index] as Record<string, unknown>;
                    const omit = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
                    const updated = { ...existing, ...omit(body as Record<string, unknown>, ['updatedAt']), id, updatedAt: timestamp() };
                    const newList = [...list];
                    newList[index] = updated;
                    const setRes = await fetch(UPSTASH_URL, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(['JSON.SET', 'tabata_workouts', '$', JSON.stringify(newList)])
                    });
                    const setData = await setRes.json();
                    if (setData.error) {
                        return jsonResponse(JSON.stringify({ error: setData.error }), 400);
                    }
                    return jsonResponse(JSON.stringify(updated), 200);
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
                const body = (await request.json()) as Record<string, unknown>;
                const omit = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
                const createdAt = timestamp();
                const workout = {
                    ...omit(body, ['id', 'createdAt', 'updatedAt']),
                    id: generateWorkoutId(),
                    createdAt,
                    updatedAt: createdAt
                };
                const response = await fetch(`${UPSTASH_URL}/JSON.ARRAPPEND/tabata_workouts/$`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(workout)
                });
                const data = await response.json();
                if (!response.ok) {
                    return jsonResponse(JSON.stringify({ error: data.error ?? 'Upstash error' }), response.status);
                }
                return jsonResponse(JSON.stringify(workout), 201);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
