import { inject, Injectable } from '@angular/core';
import { WorkoutsStore } from './workouts.store';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkoutsFacade {
    private readonly store = inject(WorkoutsStore);

    readonly workouts = this.store.workouts;
    readonly loadedWorkout = this.store.loadedWorkout;
    readonly isLoading = this.store.isLoading;
    readonly error = this.store.error;
    readonly hasWorkouts = this.store.hasWorkouts;

    loadWorkouts(search?: string): void {
        this.store['loadWorkouts'](search);
    }

    loadWorkoutById(id: string): void {
        this.store.loadWorkoutById(id);
    }

    removeWorkout(id: string): Observable<{ success: boolean }> {
        return this.store.removeWorkout(id);
    }
}
