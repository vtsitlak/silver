/**
 * Vercel serverless handler for /api/workouts/:id (GET one, PUT update, DELETE).
 * Id is parsed from request URL path.
 */

import { AuthError, requireAuthenticatedUserId } from '../firebase-auth';

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

function omitWorkoutFields(o: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    return Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
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
                const authenticatedUserId = await requireAuthenticatedUserId(request);
                const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                const data = await response.json();
                const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : (data.result ?? []);
                const list = Array.isArray(parsed) ? parsed : [];
                const existing = (list.find((w: { id?: string }) => String(w?.id) === id) as Record<string, unknown> | undefined) ?? null;
                if (!existing) {
                    return jsonResponse(JSON.stringify({ error: 'Workout not found' }), 404);
                }
                if (!isWorkoutOwner(existing, authenticatedUserId)) {
                    return jsonResponse(JSON.stringify({ error: 'Authenticated user cannot mutate another user workout' }), 403);
                }
                const setRes = await fetch(UPSTASH_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(['JSON.DEL', 'tabata_workouts', workoutPathById(id)])
                });
                const setData = await setRes.json();
                if (setData.error) {
                    return jsonResponse(JSON.stringify({ error: setData.error }), 400);
                }
                return jsonResponse(JSON.stringify({ success: true }), 200);
            }
            if (method === 'PUT') {
                const authenticatedUserId = await requireAuthenticatedUserId(request);
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
                if (!isWorkoutOwner(existing, authenticatedUserId)) {
                    return jsonResponse(JSON.stringify({ error: 'Authenticated user cannot mutate another user workout' }), 403);
                }
                const updated = {
                    ...existing,
                    ...omitWorkoutFields(body as Record<string, unknown>, ['id', 'createdAt', 'createdByUserId', 'updatedAt', 'updatedByUserId']),
                    id,
                    updatedByUserId: authenticatedUserId,
                    updatedAt: timestamp()
                };
                const setRes = await fetch(UPSTASH_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(['JSON.SET', 'tabata_workouts', workoutPathById(id), JSON.stringify(updated)])
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
            const status = error instanceof AuthError ? error.status : 500;
            return jsonResponse(JSON.stringify({ error: message }), status);
        }
    }
};
