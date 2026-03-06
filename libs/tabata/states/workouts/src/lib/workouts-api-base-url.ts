import { InjectionToken } from '@angular/core';

/**
 * Optional base URL for the workouts API.
 * - When empty (default): use same origin (/api/workouts) — use this when the app is deployed on Vercel.
 * - When set (e.g. https://your-app.vercel.app): use that origin for /api/workouts — use this when running
 *   the app locally (nx serve) so requests go to your deployed Vercel API; no local .env needed.
 */
export const WORKOUTS_API_BASE_URL = new InjectionToken<string>('WORKOUTS_API_BASE_URL', {
    providedIn: null,
    factory: () => ''
});
