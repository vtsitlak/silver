import { InjectionToken } from '@angular/core';

/**
 * Base URL for the ExerciseDB API.
 * - When empty: use 'https://www.exercisedb.dev/api/v1' (direct; may hit CORS in browser).
 * - When set (e.g. '/api/exercisedb'): use same-origin so a dev proxy can forward to ExerciseDB and avoid CORS.
 */
export const EXERCISES_API_BASE_URL = new InjectionToken<string>('EXERCISES_API_BASE_URL', {
    providedIn: null,
    factory: () => 'https://www.exercisedb.dev/api/v1'
});
