import { inject, Injectable } from '@angular/core';
import { WorkoutsStore } from './workouts.store';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkoutsFacade {
    private readonly store = inject(WorkoutsStore);

    readonly workouts = this.store.workouts;
    readonly isLoading = this.store.isLoading;
    readonly error = this.store.error;
    readonly hasWorkouts = this.store.hasWorkouts;

    loadWorkouts(): void {
        this.store.loadWorkouts();
    }

    removeWorkout(id: string): Observable<{ success: boolean }> {
        return this.store.removeWorkout(id);
    }
}
