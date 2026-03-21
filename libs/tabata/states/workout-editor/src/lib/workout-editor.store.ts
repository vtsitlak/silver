import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import {
    workoutEditorInitialState,
    type WorkoutEditorState,
    type WorkoutDraft
} from './workout-editor.models';
import { areWorkoutDraftsEqual, draftHasMeaningfulContent } from './workout-draft.util';

function draftCanSubmitWorkout(draft: WorkoutDraft): boolean {
    // Info tab required fields
    if (draft.name == null || String(draft.name).trim() === '') return false;
    if (draft.description == null || String(draft.description).trim() === '') return false;
    if (draft.mainTargetBodypart == null) return false;

    // Warmup required: at least one movement with valid exerciseId + duration
    const warmupMovements = draft.warmup?.movements;
    if (!Array.isArray(warmupMovements) || warmupMovements.length === 0) return false;
    if (
        warmupMovements.some(
            (m) =>
                !m?.exerciseId?.trim() || typeof m.durationSeconds !== 'number' || m.durationSeconds <= 0
        )
    )
        return false;

    // Cooldown required: at least one movement with valid exerciseId + duration
    const cooldownMovements = draft.cooldown?.movements;
    if (!Array.isArray(cooldownMovements) || cooldownMovements.length === 0) return false;
    if (
        cooldownMovements.some(
            (m) =>
                !m?.exerciseId?.trim() || typeof m.durationSeconds !== 'number' || m.durationSeconds <= 0
        )
    )
        return false;

    // Main required: at least one block with valid exerciseId + durations
    const blocks = draft.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return false;
    if (
        blocks.some(
            (b) =>
                !b?.exerciseId?.trim() ||
                typeof b.rounds !== 'number' ||
                b.rounds <= 0 ||
                typeof b.workDurationSeconds !== 'number' ||
                b.workDurationSeconds <= 0 ||
                typeof b.restDurationSeconds !== 'number' ||
                b.restDurationSeconds <= 0 ||
                b.interBlockRestSeconds == null ||
                typeof b.interBlockRestSeconds !== 'number' ||
                b.interBlockRestSeconds < 0
        )
    )
        return false;

    return true;
}
import { cloneDeep, isNonNullish } from '@silver/shared/helpers';
import { WorkoutsService, type TabataWorkout } from '@silver/tabata/states/workouts';

export const WorkoutEditorStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutEditorState>(workoutEditorInitialState),
    withComputed(({ workout, workoutDraft, initialDraftSnapshot, isLoading }) => ({
        isEditMode: computed(() => workout() !== null),
        isBusy: computed(() => isLoading()),
        canSubmitWorkout: computed(() => draftCanSubmitWorkout(workoutDraft())),
        hasDraftChanges: computed(() => Object.keys(workoutDraft()).length > 0),
        /** True if draft differs from initial (create: meaningful content; edit: draft !== snapshot). */
        hasUnsavedChanges: computed(() => {
            const draft = workoutDraft();
            const initial = initialDraftSnapshot();
            if (workout() === null) {
                return draftHasMeaningfulContent(draft);
            }
            if (!isNonNullish(initial)) return false;
            return !areWorkoutDraftsEqual(draft, initial);
        }),
        mergedWorkout: computed(() => {
            const current = workout();
            const draft = workoutDraft();
            if (!current) return draft;
            return { ...current, ...draft };
        })
    })),
    withMethods((store, workoutsService = inject(WorkoutsService)) => {
        const loadWorkout = rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((id) =>
                    workoutsService.getWorkoutById(id).pipe(
                        tapResponse({
                            next: (workout) =>
                                patchState(store, {
                                    workout: workout ?? null,
                                    workoutDraft: workout ? { ...workout } : {},
                                    initialDraftSnapshot: workout ? cloneDeep(workout) : null,
                                    isLoading: false
                                }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        );

        /** Set current workout from list/cache (no API call). Use when opening edit from workouts list. */
        const setWorkout = (workout: TabataWorkout | null): void => {
            patchState(store, {
                workout,
                workoutDraft: workout ? { ...workout } : {},
                initialDraftSnapshot: workout ? cloneDeep(workout) : null,
                isLoading: false,
                error: null
            });
        };

        return {
            loadWorkout,
            setWorkout,
            updateDraft: (changes: WorkoutDraft) => patchState(store, { workoutDraft: { ...store.workoutDraft(), ...changes } }),
            setDraft: (draft: WorkoutDraft) => patchState(store, { workoutDraft: draft }),
            clearDraft: () => patchState(store, { workoutDraft: {}, initialDraftSnapshot: null }),
            initDraftFromWorkout: () => {
                const workout = store.workout();
                if (workout) {
                    const draft = { ...workout };
                    patchState(store, { workoutDraft: draft, initialDraftSnapshot: cloneDeep(draft) });
                }
            },
            reset: () => patchState(store, workoutEditorInitialState)
        };
    })
);
