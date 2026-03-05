# tabata-workouts

This library was generated with [Nx](https://nx.dev).

## Overview

The `tabata-workouts` library provides the state management and API integration for workouts in the tabata-ai app. It includes:

- **WorkoutsStore** — NgRx Signals store for workout state.
- **WorkoutsService** — HTTP client for the `/api/workouts` endpoint.
- **WorkoutsFacade** — Public API for components to interact with workouts.

## API (Upstash via Vercel proxy)

The workouts service calls **`/api/workouts`** on the same origin. The Upstash token is **never** exposed in the frontend:

- **API code** lives in **`api/workouts.ts`** at the **repo root** (alongside `vercel.json`).
- **Vercel Root Directory** should be **empty** (or `.`) so Vercel finds the `api/` folder.
- **Local development:** Use `vercel dev` from repo root, or point `workoutsApiBaseUrl` in `environment.ts` to the deployed Vercel URL.
- **Production:** Deploy to Vercel with `UPSTASH_URL` and `UPSTASH_TOKEN` set in Environment Variables.

See **[docs/WORKOUTS_API_VERCEL.md](../../../docs/WORKOUTS_API_VERCEL.md)** for step-by-step setup and troubleshooting.

## Running unit tests

Run `npm run test:tabata` to execute all tabata-related tests, or `nx test tabata-workouts` for this library only.
