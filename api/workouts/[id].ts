/**
 * Vercel serverless handler for /api/workouts/:id (GET one, PUT update, DELETE).
 * Id is parsed from request URL path.
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function missingEnv(): Response {
    return new Response(JSON.stringify({ error: 'UPSTASH_URL and UPSTASH_TOKEN must be set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}

function jsonResponse(body: string, status: number): Response {
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
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
        const id = pathParts.length >= 3 ? decodeURIComponent(pathParts[2]!) : null;

        if (!id) {
            return jsonResponse(JSON.stringify({ error: 'Missing workout id' }), 400);
        }

        try {
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
                const updated = { ...body, id };
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
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
