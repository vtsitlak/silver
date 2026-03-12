/**
 * Vercel serverless proxy for ExerciseDB API.
 * Forwards /api/exercisedb/* to https://www.exercisedb.dev/api/v1/* so the frontend
 * can call same-origin and avoid CORS when deployed.
 */

const EXERCISEDB_BASE = 'https://www.exercisedb.dev/api/v1';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

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

        if (request.method !== 'GET') {
            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        }

        const url = new URL(request.url);
        const pathFromQuery = url.searchParams.get('path') ?? '';
        const pathParts = url.pathname.replace(/^\/+/, '').split('/');
        const pathnamePath = pathParts[0] === 'api' && pathParts[1] === 'exercisedb' ? pathParts.slice(2).join('/') : '';
        const subPath = pathFromQuery || pathnamePath;
        const backendPath = subPath ? `/${subPath}` : '';
        const searchParams = new URLSearchParams(url.searchParams);
        searchParams.delete('path');
        const qs = searchParams.toString();
        const backendUrl = `${EXERCISEDB_BASE}${backendPath}${qs ? (backendPath ? '?' : '?') + qs : ''}`;

        try {
            const res = await fetch(backendUrl, {
                method: 'GET',
                headers: { Accept: 'application/json' }
            });
            const text = await res.text();
            return new Response(text, {
                status: res.status,
                headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json', ...CORS_HEADERS }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
