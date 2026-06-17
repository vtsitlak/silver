import { InjectionToken } from '@angular/core';

export type UserWorkoutsAuthTokenProvider = () => Promise<string> | string | null;

export const USER_WORKOUTS_AUTH_TOKEN = new InjectionToken<UserWorkoutsAuthTokenProvider>('USER_WORKOUTS_AUTH_TOKEN', {
    providedIn: 'root',
    factory: () => () => null
});
