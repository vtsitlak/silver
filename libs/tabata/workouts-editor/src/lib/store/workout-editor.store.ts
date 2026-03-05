import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { workoutEditorInitialState, type WorkoutEditorState, type CreateWorkoutPayload, type UpdateWorkoutPayload } from './workout-editor.models';
import { WorkoutEditorService } from './workout-editor.service';

export const WorkoutEditorStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutEditorState>(workoutEditorInitialState),
    withComputed(({ workout, isLoading, isSaving }) => ({
        isEditMode: computed(() => workout() !== null),
        isBusy: computed(() => isLoading() || isSaving())
    })),
    withMethods((store, service = inject(WorkoutEditorService)) => {
        const loadWorkout = rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((id) =>
                    service.getWorkoutById(id).pipe(
                        tapResponse({
                            next: (workout) => patchState(store, { workout, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        );

        const createWorkout = rxMethod<CreateWorkoutPayload>(
            pipe(
                tap(() => patchState(store, { isSaving: true, error: null })),
                switchMap((payload) =>
                    service.createWorkout(payload).pipe(
                        tapResponse({
                            next: (workout) => patchState(store, { workout, isSaving: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isSaving: false })
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        );

        const updateWorkout = rxMethod<{ id: string; payload: UpdateWorkoutPayload }>(
            pipe(
                tap(() => patchState(store, { isSaving: true, error: null })),
                switchMap(({ id, payload }) =>
                    service.updateWorkout(id, payload).pipe(
                        tapResponse({
                            next: (workout) => patchState(store, { workout, isSaving: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isSaving: false })
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        );

        const deleteWorkout = rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isSaving: true, error: null })),
                switchMap((id) =>
                    service.deleteWorkout(id).pipe(
                        tapResponse({
                            next: () => patchState(store, { workout: null, isSaving: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isSaving: false })
                        }),
                        catchError(() => of({ success: false }))
                    )
                )
            )
        );

        return {
            loadWorkout,
            createWorkout,
            updateWorkout: (id: string, payload: UpdateWorkoutPayload) => updateWorkout({ id, payload }),
            deleteWorkout,
            reset: () => patchState(store, workoutEditorInitialState)
        };
    })
);
