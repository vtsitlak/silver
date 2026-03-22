import { BodyRegion } from '@silver/tabata/helpers';
import type { Phase, TabataWorkout, WorkoutInfoFormModel } from '@silver/tabata/states/workouts';

export type WorkoutDraft = Partial<TabataWorkout>;

/** Default main-tab block timing in the editor (classic 20s work / 10s rest, 8 rounds). */
export const DEFAULT_TABATA_WORK_DURATION_SECONDS = 20;
export const DEFAULT_TABATA_REST_DURATION_SECONDS = 10;
export const DEFAULT_TABATA_ROUNDS = 8;
export const DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS = 60;

/** Default info tab shape when no snapshot is loaded (create flow). */
export const EMPTY_WORKOUT_INFO_FORM_MODEL: WorkoutInfoFormModel = {
    name: '',
    description: '',
    generatedByAi: false,
    mainTargetBodypart: null,
    level: null,
    availableEquipments: [],
    secondaryTargetBodyparts: []
};

/** Fresh form model for mutable local state (new array references). */
export function createEmptyWorkoutInfoFormModel(): WorkoutInfoFormModel {
    return {
        ...EMPTY_WORKOUT_INFO_FORM_MODEL,
        availableEquipments: [...EMPTY_WORKOUT_INFO_FORM_MODEL.availableEquipments],
        secondaryTargetBodyparts: [...EMPTY_WORKOUT_INFO_FORM_MODEL.secondaryTargetBodyparts]
    };
}

/**
 * Maps a draft snapshot to the info form model (null/undefined → empty defaults).
 * Normalizes `mainTargetBodypart`: empty string / whitespace → `null` for the form.
 */
export function toWorkoutInfoFormModelFromSnapshot(w: WorkoutDraft | null | undefined): WorkoutInfoFormModel {
    if (w == null) {
        return EMPTY_WORKOUT_INFO_FORM_MODEL;
    }
    const main = w.mainTargetBodypart;
    const lvl = w.level;
    return {
        name: w.name ?? '',
        description: w.description ?? '',
        generatedByAi: w.generatedByAi ?? false,
        mainTargetBodypart: main != null && String(main).trim() !== '' ? main : null,
        level: lvl != null && String(lvl).trim() !== '' ? lvl : null,
        availableEquipments: w.availableEquipments ?? [],
        secondaryTargetBodyparts: w.secondaryTargetBodyparts ?? []
    };
}

export interface WorkoutEditorState {
    workoutDraft: WorkoutDraft;
    /** Snapshot of draft when workout was loaded/set (edit) or null for create. Used to detect unsaved changes. */
    initialDraftSnapshot: WorkoutDraft;
}

export const EMPTY_PHASE: Phase = { movements: [], totalDurationSeconds: 0 };

export const initialWorkoutDraft: WorkoutDraft = {
    name: '',
    description: '',
    mainTargetBodypart: undefined as BodyRegion | undefined,
    availableEquipments: [],
    secondaryTargetBodyparts: [],
    warmup: EMPTY_PHASE,
    cooldown: EMPTY_PHASE,
    blocks: []
};

export const workoutEditorInitialState: WorkoutEditorState = {
    workoutDraft: initialWorkoutDraft,
    initialDraftSnapshot: initialWorkoutDraft
};
