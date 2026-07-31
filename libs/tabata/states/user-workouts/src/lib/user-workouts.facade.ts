import { inject, Injectable } from '@angular/core';
import { UserWorkoutsStore } from './user-workouts.store';
import type { UserWorkout, UserWorkoutItem } from './user-workouts.model';

@Injectable({ providedIn: 'root' })
export class UserWorkoutsFacade {
    private readonly store = inject(UserWorkoutsStore);

    readonly userWorkout = this.store.userWorkout;
    readonly isLoading = this.store.isLoading;
    readonly error = this.store.error;
    readonly hasUserWorkout = this.store.hasUserWorkout;
    readonly hasPendingSessionAppends = this.store.hasPendingSessionAppends;

    loadUserWorkout(userId: string): void {
        this.store['loadUserWorkout'](userId);
    }

    saveUserWorkout(userWorkout: UserWorkout): void {
        this.store['saveUserWorkout'](userWorkout);
    }

    /**
     * Load user workout for userId; if none exists, create one with empty arrays and set it in state.
     */
    getOrCreateUserWorkout(userId: string): void {
        this.store['getOrCreateUserWorkout'](userId);
    }

    /**
     * Persist a finished/cancelled player session. Safe if the player is destroyed before hydration:
     * the store buffers the item until user-workout data is available.
     */
    appendWorkoutSession(userId: string, item: UserWorkoutItem): void {
        this.store['appendWorkoutSession'](userId, item);
    }
}
