/**
 * Vercel serverless proxy for Upstash (workouts).
 * Token is read from env (UPSTASH_URL, UPSTASH_TOKEN) — never in repo.
 * Local: run vercel dev from repo root; .env at repo root. Production: Vercel project env vars.
 * Root API entrypoints re-export this handler for GET list, GET by id, POST, PUT, DELETE.
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];
const FIREBASE_PROJECT_ID = process.env['FIREBASE_PROJECT_ID'] ?? 'tabata-ai-player';
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface FirebaseJwtHeader {
    alg?: string;
    kid?: string;
}

interface FirebaseJwtPayload {
    aud?: string;
    exp?: number;
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

function workoutPathById(id: string): string {
    return `$[?(@.id==${JSON.stringify(id)})]`;
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

async function readWorkoutList(headers: Record<string, string>): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error ?? `Upstash request failed with status ${response.status}`);
    }
    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
}

function isWorkoutOwner(workout: Record<string, unknown>, userId: string): boolean {
    return String(workout['createdByUserId'] ?? '') === userId;
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
            if (isIdRoute && id) {
                if (method === 'GET') {
                    const list = await readWorkoutList(headers);
                    const workout = list.find((w) => String(w['id'] ?? '') === id) ?? null;
                    return jsonResponse(JSON.stringify(workout), 200);
                }
                if (method === 'DELETE') {
                    const authenticatedUserId = await requireAuthenticatedUserId(request);
                    const list = await readWorkoutList(headers);
                    const workout = list.find((w) => String(w['id'] ?? '') === id) ?? null;
                    if (!workout) {
                        return jsonResponse(JSON.stringify({ error: 'Workout not found' }), 404);
                    }
                    if (!isWorkoutOwner(workout, authenticatedUserId)) {
                        return jsonResponse(JSON.stringify({ error: 'Authenticated user cannot mutate another user workout' }), 403);
                    }
                    const setRes = await fetch(UPSTASH_URL, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(['JSON.DEL', 'tabata_workouts', workoutPathById(id)])
                    });
                    const setData = await setRes.json();
                    if (!setRes.ok || setData.error) {
                        return jsonResponse(JSON.stringify({ error: setData.error ?? 'Upstash error' }), setRes.ok ? 400 : setRes.status);
                    }
                    return jsonResponse(JSON.stringify({ success: true }), 200);
                }
                if (method === 'PUT') {
                    const authenticatedUserId = await requireAuthenticatedUserId(request);
                    const body = await request.json();
                    const list = await readWorkoutList(headers);
                    const index = list.findIndex((w) => String(w['id'] ?? '') === id);
                    if (index === -1) {
                        return jsonResponse(JSON.stringify({ error: 'Workout not found' }), 404);
                    }
                    const existing = list[index] as Record<string, unknown>;
                    if (!isWorkoutOwner(existing, authenticatedUserId)) {
                        return jsonResponse(JSON.stringify({ error: 'Authenticated user cannot mutate another user workout' }), 403);
                    }
                    const omit = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
                    const updated = {
                        ...existing,
                        ...omit(body as Record<string, unknown>, ['id', 'createdAt', 'createdByUserId', 'updatedAt', 'updatedByUserId']),
                        id,
                        createdAt: existing['createdAt'],
                        createdByUserId: existing['createdByUserId'],
                        updatedByUserId: authenticatedUserId,
                        updatedAt: timestamp()
                    };
                    const setRes = await fetch(UPSTASH_URL, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(['JSON.SET', 'tabata_workouts', workoutPathById(id), JSON.stringify(updated)])
                    });
                    const setData = await setRes.json();
                    if (!setRes.ok || setData.error) {
                        return jsonResponse(JSON.stringify({ error: setData.error ?? 'Upstash error' }), setRes.ok ? 400 : setRes.status);
                    }
                    return jsonResponse(JSON.stringify(updated), 200);
                }
                return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
            }

            if (method === 'GET') {
                const list = await readWorkoutList(headers);
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
                const authenticatedUserId = await requireAuthenticatedUserId(request);
                const body = (await request.json()) as Record<string, unknown>;
                const omit = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
                const createdAt = timestamp();
                const workout = {
                    ...omit(body, ['id', 'createdAt', 'createdByUserId', 'updatedAt', 'updatedByUserId']),
                    id: generateWorkoutId(),
                    createdByUserId: authenticatedUserId,
                    updatedByUserId: authenticatedUserId,
                    createdAt,
                    updatedAt: createdAt
                };
                const response = await fetch(`${UPSTASH_URL}/JSON.ARRAPPEND/tabata_workouts/$`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(workout)
                });
                const data = await response.json();
                if (!response.ok || data.error) {
                    return jsonResponse(JSON.stringify({ error: data.error ?? 'Upstash error' }), response.status);
                }
                return jsonResponse(JSON.stringify(workout), 201);
            }

            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            const status = error instanceof AuthError ? error.status : 500;
            return jsonResponse(JSON.stringify({ error: message }), status);
        }
    }
};
