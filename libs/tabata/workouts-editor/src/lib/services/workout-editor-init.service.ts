import { inject, Injectable } from '@angular/core';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutsService } from '@silver/tabata/states/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorInitService {
    private readonly workoutsService = inject(WorkoutsService);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly toast = inject(ToastService);

    /**
     * Loads a workout by id and hydrates the workout editor store.
     * Shows a toast on HTTP failure or when the workout is missing.
     */
    loadWorkoutForEditor(workoutId: string): void {
        this.workoutsService.getWorkoutById(workoutId).subscribe({
            next: (workout) => {
                if (!workout) {
                    void this.toast.showError('Workout not found.');
                    return;
                }
                this.workoutEditorFacade.hydrateEditorFromWorkout(workout);
            },
            error: () => {
                void this.toast.showError('Could not load workout. Please try again.');
            }
        });
    }
}
