# tabata-workouts

This library was generated with [Nx](https://nx.dev).

## API (Upstash via Vercel proxy)

The workouts service calls **`/api/workouts`** on the same origin. The token is **never** in the frontend:

- **API code** lives in **`apps/tabata-ai/api/workouts.ts`** (with `apps/tabata-ai/vercel.json`). Vercel project **Root Directory** must be set to `apps/tabata-ai`.
- **Local:** Use `vercel dev` from repo root; it runs the Angular app and the `/api` proxy, reading `UPSTASH_URL` and `UPSTASH_TOKEN` from `.env` (git-ignored).
- **Production:** Deploy to Vercel with Root Directory = `apps/tabata-ai`; set `UPSTASH_URL` and `UPSTASH_TOKEN` in the project’s Environment Variables.

See **`docs/WORKOUTS_API_VERCEL.md`** in the repo root for step-by-step setup.

## Running unit tests

Run `nx test tabata-workouts` to execute the unit tests.
