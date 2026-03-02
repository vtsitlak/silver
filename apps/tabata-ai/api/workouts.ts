/**
 * Vercel serverless proxy for Upstash (workouts).
 * Token is read from env (UPSTASH_URL, UPSTASH_TOKEN) — never in repo.
 * Local: run vercel dev from repo root; .env at repo root. Production: Vercel project env vars.
 */

const UPSTASH_URL = process.env['UPSTASH_URL'];
const UPSTASH_TOKEN = process.env['UPSTASH_TOKEN'];

function missingEnv(): Response {
    return new Response(
        JSON.stringify({ error: 'UPSTASH_URL and UPSTASH_TOKEN must be set (e.g. in .env or Vercel)' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
}

export default {
    async fetch(request: Request): Promise<Response> {
        const { method } = request;

        if (!UPSTASH_URL || !UPSTASH_TOKEN) {
            return missingEnv();
        }

        const headers: Record<string, string> = {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
        };

        try {
            if (method === 'GET') {
                const response = await fetch(`${UPSTASH_URL}/JSON.GET/tabata_workouts`, { headers });
                const data = await response.json();
                // Upstash Redis JSON.GET returns stringified JSON; parse if needed
                const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result ?? [];
                return new Response(JSON.stringify(Array.isArray(parsed) ? parsed : []), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
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
                    return new Response(JSON.stringify({ error: data.error ?? 'Upstash error' }), {
                        status: response.status,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return new Response(JSON.stringify({ error: message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
