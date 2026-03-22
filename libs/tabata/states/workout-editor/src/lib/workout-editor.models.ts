import { BodyRegion } from '@silver/tabata/helpers';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

export type WorkoutDraft = Partial<TabataWorkout>;

export interface WorkoutEditorState {
    workoutDraft: WorkoutDraft;
    /** Snapshot of draft when workout was loaded/set (edit) or null for create. Used to detect unsaved changes. */
    initialDraftSnapshot: WorkoutDraft;
    isLoading: boolean;
    error: string | null;
}

export const initialWorkoutDraft: WorkoutDraft = {
    name: '',
    description: '',
    mainTargetBodypart: '' as BodyRegion,
    availableEquipments: [],
    secondaryTargetBodyparts: [],
    warmup: {
        movements: [],
        totalDurationSeconds: 0
    },
    cooldown: {
        movements: [],
        totalDurationSeconds: 0
    },
    blocks: []
  }

export const workoutEditorInitialState: WorkoutEditorState = {
    workoutDraft: initialWorkoutDraft,
    initialDraftSnapshot: initialWorkoutDraft,
    isLoading: false,
    error: null
};
