import { inject } from '@angular/core';
import { Router, type CanDeactivateFn } from '@angular/router';
import { WorkoutEditorCancelService } from '../services/workout-editor-cancel.service';
import type { WorkoutEditorComponent } from '../components/workout-editor/workout-editor.component';

/** Passed via `Router.navigate(..., { state: { [SKIP_WORKOUT_EDITOR_CANCEL]: true } })` (e.g. after successful save). */
export const SKIP_WORKOUT_EDITOR_CANCEL = 'skipWorkoutEditorCancel';

/**
 * Confirms leaving the workout editor (back, cancel, or any navigation away).
 * Skips the prompt when navigation includes {@link SKIP_WORKOUT_EDITOR_CANCEL} in `extras.state`.
 */
export const workoutEditorCanDeactivateGuard: CanDeactivateFn<WorkoutEditorComponent> = () => {
    const cancel = inject(WorkoutEditorCancelService);
    const router = inject(Router);
    const nav = router.currentNavigation();
    const skip = nav?.extras?.state?.[SKIP_WORKOUT_EDITOR_CANCEL] === true;
    if (skip) {
        return true;
    }
    return cancel.confirmCancel().then((stay) => !stay);
};
