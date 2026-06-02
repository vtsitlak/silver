/**
 * Vercel serverless handler for /api/user-workouts/:userId (GET one, PUT upsert).
 * Same env as workouts: UPSTASH_URL, UPSTASH_TOKEN.
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

interface UpstashResponse {
    result?: unknown;
    error?: string;
}

function userWorkoutKey(userId: string): string {
    return `user_workouts:${encodeURIComponent(userId)}`;
}

function parseJsonResult<T>(result: unknown, fallback: T): T {
    if (typeof result === 'string') {
        return JSON.parse(result) as T;
    }
    return (result ?? fallback) as T;
}

function normalizeUserWorkout(body: Partial<UserWorkoutRecord> | null | undefined, userId: string): UserWorkoutRecord {
    return {
        userId,
        favoriteWorkouts: Array.isArray(body?.favoriteWorkouts) ? body.favoriteWorkouts.map((id) => String(id)) : [],
        workoutItems: Array.isArray(body?.workoutItems)
            ? body.workoutItems.map((item) => ({
                  workoutId: String(item?.workoutId ?? ''),
                  completed: Boolean(item?.completed),
                  startedAt: String(item?.startedAt ?? ''),
                  finishedAt: String(item?.finishedAt ?? '')
              }))
            : []
    };
}

async function postUpstashCommand(headers: Record<string, string>, command: string[]): Promise<UpstashResponse> {
    const response = await fetch(UPSTASH_URL as string, {
        method: 'POST',
        headers,
        body: JSON.stringify(command)
    });
    const data = (await response.json()) as UpstashResponse;
    if (!response.ok || data.error) {
        throw new Error(data.error ?? `Upstash request failed with status ${response.status}`);
    }
    return data;
}

async function readLegacyUserWorkouts(headers: Record<string, string>): Promise<UserWorkoutRecord[]> {
    const response = await fetch(`${UPSTASH_URL}/JSON.GET/user_workouts`, { headers });
    const data = (await response.json()) as UpstashResponse;
    if (!response.ok || data.error) {
        throw new Error(data.error ?? `Upstash request failed with status ${response.status}`);
    }
    const parsed = parseJsonResult<unknown>(data.result, []);
    return Array.isArray(parsed) ? (parsed as UserWorkoutRecord[]) : [];
}

async function readUserWorkout(headers: Record<string, string>, userId: string): Promise<UserWorkoutRecord | null> {
    const data = await postUpstashCommand(headers, ['JSON.GET', userWorkoutKey(userId)]);
    const directRecord = parseJsonResult<UserWorkoutRecord | null>(data.result, null);
    if (directRecord !== null) {
        return normalizeUserWorkout(directRecord, userId);
    }

    const legacyList = await readLegacyUserWorkouts(headers);
    const legacyRecord = legacyList.find((u) => String(u?.userId) === userId) ?? null;
    return legacyRecord ? normalizeUserWorkout(legacyRecord, userId) : null;
}

async function deleteLegacyUserWorkout(headers: Record<string, string>, userId: string): Promise<void> {
    const legacyList = await readLegacyUserWorkouts(headers);
    const index = legacyList.findIndex((u) => String(u?.userId) === userId);
    if (index < 0) return;

    await postUpstashCommand(headers, ['JSON.DEL', 'user_workouts', `$[${index}]`]);
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
        const userId = pathParts.length >= 3 ? decodeURIComponent(pathParts[2]!) : null;

        if (!userId) {
            return jsonResponse(JSON.stringify({ error: 'Missing userId: use GET or PUT /api/user-workouts/:userId' }), 400);
        }

        try {
            if (method === 'GET') {
                const record = await readUserWorkout(headers, userId);
                return jsonResponse(JSON.stringify(record), 200);
            }

            if (method === 'DELETE') {
                await postUpstashCommand(headers, ['DEL', userWorkoutKey(userId)]);
                await deleteLegacyUserWorkout(headers, userId);
                return jsonResponse(JSON.stringify({ success: true }), 200);
            }

            if (method === 'PUT') {
                const body = (await request.json()) as Partial<UserWorkoutRecord>;
                const normalized = normalizeUserWorkout(body, userId);
                await postUpstashCommand(headers, ['JSON.SET', userWorkoutKey(userId), '$', JSON.stringify(normalized)]);
                return jsonResponse(JSON.stringify(normalized), 200);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
