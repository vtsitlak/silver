import { inject, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutsService } from '@silver/tabata/states/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorInitService {
    private readonly workoutsService = inject(WorkoutsService);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly toast = inject(ToastService);

    private pendingLoadSub: Subscription | null = null;
    private latestRequestedWorkoutId: string | null = null;

    /**
     * Loads a workout by id and hydrates the workout editor store.
     * Shows a toast on HTTP failure or when the workout is missing.
     *
     * Ignores stale responses when a newer load is requested (or the pending load is cancelled),
     * so rapid navigation between edit/create routes cannot overwrite the active editor.
     */
    loadWorkoutForEditor(workoutId: string): void {
        this.latestRequestedWorkoutId = workoutId;
        this.pendingLoadSub?.unsubscribe();
        this.pendingLoadSub = this.workoutsService.getWorkoutById(workoutId).subscribe({
            next: (workout) => {
                if (this.latestRequestedWorkoutId !== workoutId) {
                    return;
                }
                if (!workout) {
                    void this.toast.showError('Workout not found.');
                    return;
                }
                this.workoutEditorFacade.hydrateEditorFromWorkout(workout);
            },
            error: () => {
                if (this.latestRequestedWorkoutId !== workoutId) {
                    return;
                }
                void this.toast.showError('Could not load workout. Please try again.');
            }
        });
    }

    /** Cancels any in-flight editor load so a stale response cannot hydrate the store. */
    cancelPendingLoad(): void {
        this.latestRequestedWorkoutId = null;
        this.pendingLoadSub?.unsubscribe();
        this.pendingLoadSub = null;
    }
}
