import type { TabataWorkout } from '@silver/tabata/states/workouts';

export type WorkoutDraft = Partial<TabataWorkout>;

export interface WorkoutEditorState {
    workout: TabataWorkout | null;
    workoutDraft: WorkoutDraft;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

export const workoutEditorInitialState: WorkoutEditorState = {
    workout: null,
    workoutDraft: {},
    isLoading: false,
    isSaving: false,
    error: null
};

export type CreateWorkoutPayload = Omit<TabataWorkout, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWorkoutPayload = Partial<Omit<TabataWorkout, 'id' | 'createdAt' | 'createdByUserId'>>;
