import { InjectionToken } from '@angular/core';

export type WorkoutsAuthTokenProvider = () => Promise<string> | string | null;

export const WORKOUTS_AUTH_TOKEN = new InjectionToken<WorkoutsAuthTokenProvider>('WORKOUTS_AUTH_TOKEN', {
    providedIn: 'root',
    factory: () => () => null
});
