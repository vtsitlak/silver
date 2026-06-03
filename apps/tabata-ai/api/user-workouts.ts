/**
 * Vercel serverless proxy for Upstash (user_workouts).
 * Same env as workouts: UPSTASH_URL, UPSTASH_TOKEN.
 * GET /api/user-workouts/:userId — get one user's record.
 * PUT /api/user-workouts/:userId — upsert: create a new record or update existing by userId.
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];
const FIREBASE_PROJECT_ID = process.env['FIREBASE_PROJECT_ID'] ?? 'tabata-ai-player';
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

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

interface FirebaseJwtHeader {
    alg?: string;
    kid?: string;
}

interface FirebaseJwtPayload {
    aud?: string;
    exp?: number;
    iat?: number;
    iss?: string;
    sub?: string;
    user_id?: string;
}

interface FirebaseJwksResponse {
    keys?: JsonWebKey[];
}

class AuthError extends Error {
    constructor(
        message: string,
        readonly status: number = 401
    ) {
        super(message);
    }
}

function userWorkoutKey(userId: string): string {
    return `user_workouts:${encodeURIComponent(userId)}`;
}

function legacyUserWorkoutPath(userId: string): string {
    return `$[?(@.userId==${JSON.stringify(userId)})]`;
}

function decodeBase64Url(input: string): Uint8Array {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    if (typeof atob === 'function') {
        const binary = atob(padded);
        return Uint8Array.from(binary, (char) => char.charCodeAt(0));
    }
    return Uint8Array.from(Buffer.from(padded, 'base64'));
}

function decodeJwtPart<T>(input: string): T {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(input))) as T;
}

async function fetchFirebasePublicKeys(): Promise<JsonWebKey[]> {
    const response = await fetch(FIREBASE_JWKS_URL);
    const data = (await response.json()) as FirebaseJwksResponse;
    if (!response.ok) {
        throw new AuthError('Unable to verify bearer token');
    }
    return data.keys ?? [];
}

async function verifyFirebaseIdToken(token: string): Promise<string> {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new AuthError('Invalid bearer token');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
    const header = decodeJwtPart<FirebaseJwtHeader>(encodedHeader);
    if (header.alg !== 'RS256' || !header.kid) {
        throw new AuthError('Invalid bearer token');
    }

    const publicKeys = await fetchFirebasePublicKeys();
    const publicKey = publicKeys.find((key) => key.kid === header.kid && key.alg === 'RS256');
    if (!publicKey) {
        throw new AuthError('Invalid bearer token');
    }

    const key = await crypto.subtle.importKey('jwk', publicKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = decodeBase64Url(encodedSignature);
    const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const isValid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, signedData);
    if (!isValid) {
        throw new AuthError('Invalid bearer token');
    }

    const payload = decodeJwtPart<FirebaseJwtPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    const uid = payload.user_id ?? payload.sub;
    if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== expectedIssuer || !uid || payload.exp === undefined || payload.exp <= now) {
        throw new AuthError('Invalid bearer token');
    }

    return uid;
}

async function requireAuthenticatedUserId(request: Request): Promise<string> {
    const authorization = request.headers.get('Authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        throw new AuthError('Missing bearer token');
    }
    return verifyFirebaseIdToken(match[1]!);
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
    await postUpstashCommand(headers, ['JSON.DEL', 'user_workouts', legacyUserWorkoutPath(userId)]);
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
            const authenticatedUserId = await requireAuthenticatedUserId(request);
            if (authenticatedUserId !== userId) {
                return jsonResponse(JSON.stringify({ error: 'Authenticated user cannot access another user workout record' }), 403);
            }

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
                // Upsert: update existing or append new record for this userId
                const body = (await request.json()) as Partial<UserWorkoutRecord>;
                const normalized = normalizeUserWorkout(body, userId);
                await postUpstashCommand(headers, ['JSON.SET', userWorkoutKey(userId), '$', JSON.stringify(normalized)]);
                return jsonResponse(JSON.stringify(normalized), 200);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            const status = error instanceof AuthError ? error.status : 500;
            return jsonResponse(JSON.stringify({ error: message }), status);
        }
    }
};
