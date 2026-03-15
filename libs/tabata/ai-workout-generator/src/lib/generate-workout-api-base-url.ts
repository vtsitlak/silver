import { InjectionToken } from '@angular/core';

/**
 * Optional base URL for the generate-workout API (e.g. https://silver-tabata-ai.vercel.app).
 * When empty: use same origin (/api/generate-workout). When set: use that origin for the API.
 */
export const GENERATE_WORKOUT_API_BASE_URL = new InjectionToken<string>('GENERATE_WORKOUT_API_BASE_URL', {
    providedIn: null,
    factory: () => ''
});
