import { InjectionToken } from '@angular/core';

/**
 * Optional base URL for the user-workouts API.
 * When empty (default): use same origin (/api/user-workouts).
 * When set: use that origin for /api/user-workouts (e.g. when running locally against deployed Vercel).
 */
export const USER_WORKOUTS_API_BASE_URL = new InjectionToken<string>('USER_WORKOUTS_API_BASE_URL', {
    providedIn: null,
    factory: () => ''
});
