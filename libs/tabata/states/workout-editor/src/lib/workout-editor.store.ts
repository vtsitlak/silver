import { computed } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';

import { cloneDeep } from '@silver/shared/helpers';
import { TabataWorkout } from '@silver/tabata/states/workouts';

import {
    type WorkoutEditorState,
    type WorkoutDraft,
    type AiGeneratedWorkoutStructure,
    ensureBodyweightIncluded,
    initialWorkoutDraft
} from './workout-editor.models';
import { areWorkoutDraftsEqual, draftHasMeaningfulContent } from './workout-draft.util';

function draftCanSubmitWorkout(draft: WorkoutDraft): boolean {
    // Info tab required fields
    if (draft.name == null || String(draft.name).trim() === '') return false;
    if (draft.description == null || String(draft.description).trim() === '') return false;
    if (draft.mainTargetBodypart == null || String(draft.mainTargetBodypart).trim() === '') return false;
    if (draft.level == null || String(draft.level).trim() === '') return false;
    if (draft.primaryGoal == null || String(draft.primaryGoal).trim() === '') return false;

    // Warmup required: at least one movement with valid exerciseId + duration
    const warmupMovements = draft.warmup?.movements;
    if (!Array.isArray(warmupMovements) || warmupMovements.length === 0) return false;
    if (warmupMovements.some((m) => !m?.exerciseId?.trim() || typeof m.durationSeconds !== 'number' || m.durationSeconds <= 0)) return false;

    // Cooldown required: at least one movement with valid exerciseId + duration
    const cooldownMovements = draft.cooldown?.movements;
    if (!Array.isArray(cooldownMovements) || cooldownMovements.length === 0) return false;
    if (cooldownMovements.some((m) => !m?.exerciseId?.trim() || typeof m.durationSeconds !== 'number' || m.durationSeconds <= 0)) return false;

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

function createFreshWorkoutEditorState(): WorkoutEditorState {
    return {
        workoutDraft: cloneDeep(initialWorkoutDraft),
        initialDraftSnapshot: cloneDeep(initialWorkoutDraft),
        aiStructureLock: null
    };
}

function withPinnedAiStructure(draft: WorkoutDraft, lock: AiGeneratedWorkoutStructure | null): WorkoutDraft {
    if (!lock) return draft;
    return {
        ...draft,
        warmup: lock.warmup,
        blocks: lock.blocks,
        cooldown: lock.cooldown,
        totalDurationMinutes: lock.totalDurationMinutes,
        generatedByAi: true
    };
}

export const WorkoutEditorStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutEditorState>(createFreshWorkoutEditorState()),
    withComputed(({ workoutDraft, initialDraftSnapshot }) => ({
        isEditMode: computed(() => !!initialDraftSnapshot()?.id),
        canSubmitWorkout: computed(() => draftCanSubmitWorkout(workoutDraft())),
        hasDraftChanges: computed(() => Object.keys(workoutDraft()).length > 0),
        /** True if draft differs from initial (create: meaningful content; edit: draft !== snapshot). */
        hasUnsavedChanges: computed(() => {
            const draft = workoutDraft();
            const initial = initialDraftSnapshot();
            if (!initial?.id) {
                return draftHasMeaningfulContent(draft);
            }
            return !areWorkoutDraftsEqual(draft, initial);
        }),
        mergedWorkout: computed(() => {
            const current = initialDraftSnapshot();
            const draft = workoutDraft();
            if (!current?.id) return draft;
            return { ...current, ...draft };
        })
    })),
    withMethods((store) => {
        /** Applies a loaded workout to draft + baseline snapshot (e.g. after GET by id). */
        const hydrateEditorFromWorkout = (workout: TabataWorkout): void => {
            const normalizedWorkout: TabataWorkout = {
                ...workout,
                availableEquipments: ensureBodyweightIncluded(workout.availableEquipments)
            };
            patchState(store, {
                workoutDraft: { ...normalizedWorkout },
                initialDraftSnapshot: cloneDeep(normalizedWorkout),
                aiStructureLock: null
            });
        };

        return {
            hydrateEditorFromWorkout,
            /**
             * Pins AI-generated structure into the draft and blocks child-tab sync from overwriting
             * warmup/blocks/cooldown until {@link clearAiStructureLock} / reset / clearDraft.
             */
            lockAiGeneratedStructure: (structure: AiGeneratedWorkoutStructure) => {
                const lock: AiGeneratedWorkoutStructure = {
                    warmup: structure.warmup,
                    blocks: structure.blocks,
                    cooldown: structure.cooldown,
                    totalDurationMinutes: structure.totalDurationMinutes
                };
                // Snapshot must include live info fields (name/description/…) as well as AI
                // structure. The Info tab rehydrates from `initialDraftSnapshot`; spreading only
                // the create-mode baseline (empty info) made it emit blank fields and wipe the
                // draft before preview Save.
                const nextDraft = withPinnedAiStructure({ ...store.workoutDraft(), ...lock, generatedByAi: true }, lock);
                patchState(store, {
                    aiStructureLock: lock,
                    workoutDraft: nextDraft,
                    initialDraftSnapshot: cloneDeep(nextDraft)
                });
            },
            clearAiStructureLock: () => patchState(store, { aiStructureLock: null }),
            updateDraft: (changes: WorkoutDraft) => {
                const lock = store.aiStructureLock();
                const merged = { ...store.workoutDraft(), ...changes };
                patchState(store, { workoutDraft: withPinnedAiStructure(merged, lock) });
            },
            setDraft: (draft: WorkoutDraft) => {
                const lock = store.aiStructureLock();
                patchState(store, { workoutDraft: withPinnedAiStructure(draft, lock) });
            },
            clearDraft: () =>
                patchState(store, {
                    workoutDraft: cloneDeep(initialWorkoutDraft),
                    initialDraftSnapshot: cloneDeep(initialWorkoutDraft),
                    aiStructureLock: null
                }),
            reset: () => patchState(store, createFreshWorkoutEditorState())
        };
    })
);
