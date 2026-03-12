import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import {
    workoutEditorInitialState,
    type WorkoutEditorState,
    type CreateWorkoutPayload,
    type UpdateWorkoutPayload,
    type WorkoutDraft
} from './workout-editor.models';
import { WorkoutEditorService } from './workout-editor.service';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

export const WorkoutEditorStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutEditorState>(workoutEditorInitialState),
    withComputed(({ workout, workoutDraft, isLoading, isSaving }) => ({
        isEditMode: computed(() => workout() !== null),
        isBusy: computed(() => isLoading() || isSaving()),
        hasDraftChanges: computed(() => Object.keys(workoutDraft()).length > 0),
        mergedWorkout: computed(() => {
            const current = workout();
            const draft = workoutDraft();
            if (!current) return draft;
            return { ...current, ...draft };
        })
    })),
    withMethods((store, service = inject(WorkoutEditorService)) => {
        const loadWorkout = rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((id) =>
                    service.getWorkoutById(id).pipe(
                        tapResponse({
                            next: (workout) => patchState(store, { workout, workoutDraft: workout ? { ...workout } : {}, isLoading: false }),
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

        const startSave = (): void => {
            patchState(store, { isSaving: true, error: null });
        };

        const setWorkoutFromResponse = (workout: TabataWorkout): void => {
            patchState(store, { workout, isSaving: false });
        };

        /** Set current workout from list/cache (no API call). Use when opening edit from workouts list. */
        const setWorkout = (workout: TabataWorkout | null): void => {
            patchState(store, {
                workout,
                workoutDraft: workout ? { ...workout } : {},
                isLoading: false,
                error: null
            });
        };

        const setSaveError = (message: string): void => {
            patchState(store, { error: message, isSaving: false });
        };

        return {
            loadWorkout,
            createWorkout,
            updateWorkout: (id: string, payload: UpdateWorkoutPayload) => updateWorkout({ id, payload }),
            deleteWorkout,
            startSave,
            setWorkoutFromResponse,
            setWorkout,
            setSaveError,
            updateDraft: (changes: WorkoutDraft) => patchState(store, { workoutDraft: { ...store.workoutDraft(), ...changes } }),
            setDraft: (draft: WorkoutDraft) => patchState(store, { workoutDraft: draft }),
            clearDraft: () => patchState(store, { workoutDraft: {} }),
            initDraftFromWorkout: () => {
                const workout = store.workout();
                if (workout) {
                    patchState(store, { workoutDraft: { ...workout } });
                }
            },
            reset: () => patchState(store, workoutEditorInitialState)
        };
    })
);
