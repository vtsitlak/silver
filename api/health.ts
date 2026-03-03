/**
 * Minimal Vercel serverless route to verify API deployment.
 * GET /api/health → 200 { "ok": true }.
 * Useful to confirm that the api/ folder is deployed (if this 404s, the whole api/ is missing).
 */
export default {
    async fetch(): Promise<Response> {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
