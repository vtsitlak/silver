import { InjectionToken, type Signal, signal } from '@angular/core';

export const USER_WORKOUTS_ACTIVE_USER_ID = new InjectionToken<Signal<string | null>>('USER_WORKOUTS_ACTIVE_USER_ID', {
    providedIn: 'root',
    factory: () => signal(null)
});
