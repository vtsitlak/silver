/**
 * Vercel serverless proxy for Upstash (user_workouts).
 * Same env as workouts: UPSTASH_URL, UPSTASH_TOKEN.
 * GET /api/user-workouts/:userId — get one user's record.
 * PUT /api/user-workouts/:userId — upsert: create a new record or update existing by userId.
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function missingEnv(): Response {
    return new Response(JSON.stringify({ error: 'UPSTASH_URL and UPSTASH_TOKEN must be set' }), {
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

interface UserWorkoutRecord {
    userId: string;
    favoriteWorkouts: string[];
    workoutItems: { workoutId: string; completed: boolean; startedAt: string; finishedAt: string }[];
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
        const isUserIdRoute = pathParts.length >= 3 && pathParts[0] === 'api' && pathParts[1] === 'user-workouts';
        const userId = isUserIdRoute ? decodeURIComponent(pathParts[2]!) : null;

        if (!isUserIdRoute || !userId) {
            return jsonResponse(JSON.stringify({ error: 'Missing userId: use GET or PUT /api/user-workouts/:userId' }), 400);
        }

        try {
            const response = await fetch(`${UPSTASH_URL}/JSON.GET/user_workouts`, { headers });
            const data = await response.json();
            const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
            const list: UserWorkoutRecord[] = Array.isArray(parsed) ? parsed : [];
            const index = list.findIndex((u: UserWorkoutRecord) => String(u?.userId) === userId);

            if (method === 'GET') {
                const record = index >= 0 ? list[index] : null;
                return jsonResponse(JSON.stringify(record), 200);
            }

            if (method === 'PUT') {
                // Upsert: update existing or append new record for this userId
                const body = (await request.json()) as UserWorkoutRecord;
                const normalized: UserWorkoutRecord = {
                    userId: String(body.userId ?? userId),
                    favoriteWorkouts: Array.isArray(body.favoriteWorkouts) ? body.favoriteWorkouts : [],
                    workoutItems: Array.isArray(body.workoutItems)
                        ? body.workoutItems.map((item) => ({
                              workoutId: String(item.workoutId),
                              completed: Boolean(item.completed),
                              startedAt: String(item.startedAt ?? ''),
                              finishedAt: String(item.finishedAt ?? '')
                          }))
                        : []
                };

                let newList: UserWorkoutRecord[];
                if (index >= 0) {
                    newList = [...list];
                    newList[index] = normalized;
                } else {
                    newList = [...list, normalized];
                }

                const setRes = await fetch(UPSTASH_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(['JSON.SET', 'user_workouts', '$', JSON.stringify(newList)])
                });
                const setData = await setRes.json();
                if (setData.error) {
                    return jsonResponse(JSON.stringify({ error: setData.error }), 400);
                }
                return jsonResponse(JSON.stringify(normalized), 200);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
