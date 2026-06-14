import { InjectionToken } from '@angular/core';

export type WorkoutsAuthTokenProvider = () => string | Promise<string | null> | null;

export const WORKOUTS_AUTH_TOKEN = new InjectionToken<WorkoutsAuthTokenProvider>('WORKOUTS_AUTH_TOKEN', {
    providedIn: null,
    factory: () => () => null
});
