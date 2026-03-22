import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@silver/tabata/helpers';
import { EMPTY, type Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { WorkoutsStore } from './workouts.store';
import type { CreateWorkoutPayload, TabataWorkout, UpdateWorkoutPayload } from './workouts.models';

@Injectable({ providedIn: 'root' })
export class WorkoutsFacade {
    private readonly store = inject(WorkoutsStore);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastService);

    readonly workouts = this.store.workouts;
    readonly loadedWorkout = this.store.loadedWorkout;
    readonly isLoading = this.store.isLoading;
    readonly isSaving = this.store.isSaving;
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

    submitWorkoutAsCreate(payload: CreateWorkoutPayload, options: SaveWorkoutOptions = {}): Observable<TabataWorkout> {
        return this.submitWorkoutInternal('create', payload, undefined, options);
    }

    submitWorkoutAsUpdate(id: string, payload: UpdateWorkoutPayload, options: SaveWorkoutOptions = {}): Observable<TabataWorkout> {
        return this.submitWorkoutInternal('update', payload, id, options);
    }

    private submitWorkoutInternal(
        action: 'create' | 'update',
        payload: CreateWorkoutPayload | UpdateWorkoutPayload,
        id: string | undefined,
        options: SaveWorkoutOptions
    ): Observable<TabataWorkout> {
        const navigateToWorkouts = options.navigateToWorkouts ?? true;
        const showSuccessToast = options.showSuccessToast ?? navigateToWorkouts;
        const showErrorToast = options.showErrorToast ?? true;

        const successMessage = action === 'update' ? 'Workout updated' : 'Workout created';

        const request$ =
            action === 'update' ? this.store.updateWorkout(id!, payload as UpdateWorkoutPayload) : this.store.createWorkout(payload as CreateWorkoutPayload);

        return request$.pipe(
            tap((_workout) => {
                if (showSuccessToast) this.toast.showSuccess(successMessage);
                if (navigateToWorkouts) {
                    /** Lets workout editor `canDeactivate` allow leave without a second confirm after save. */
                    this.router.navigate(['/tabs/workouts'], {
                        state: { skipWorkoutEditorCancel: true }
                    });
                }
            }),
            catchError((err: unknown) => {
                if (showErrorToast) {
                    const message = err instanceof Error ? err.message : 'Failed to save workout';
                    this.toast.showError(message);
                }
                return EMPTY;
            })
        );
    }
}

export interface SaveWorkoutOptions {
    /** Defaults to true. Navigates back to `/tabs/workouts` on success. */
    navigateToWorkouts?: boolean;
    /** Defaults to `navigateToWorkouts`. Shows success toast on success. */
    showSuccessToast?: boolean;
    /** Defaults to true. Shows error toast on failure. */
    showErrorToast?: boolean;
}
