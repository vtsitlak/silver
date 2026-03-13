import type { TabataWorkout } from '@silver/tabata/states/workouts';

export type WorkoutDraft = Partial<TabataWorkout>;

export interface WorkoutEditorState {
    workout: TabataWorkout | null;
    workoutDraft: WorkoutDraft;
    /** Snapshot of draft when workout was loaded/set (edit) or null for create. Used to detect unsaved changes. */
    initialDraftSnapshot: WorkoutDraft | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

export const workoutEditorInitialState: WorkoutEditorState = {
    workout: null,
    workoutDraft: {},
    initialDraftSnapshot: null,
    isLoading: false,
    isSaving: false,
    error: null
};

export type CreateWorkoutPayload = Omit<TabataWorkout, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWorkoutPayload = Partial<Omit<TabataWorkout, 'id' | 'createdAt' | 'createdByUserId'>>;
