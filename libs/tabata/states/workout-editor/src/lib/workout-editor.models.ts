import type { TabataWorkout } from '@silver/tabata/states/workouts';

export interface WorkoutEditorState {
    workout: TabataWorkout | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

export const workoutEditorInitialState: WorkoutEditorState = {
    workout: null,
    isLoading: false,
    isSaving: false,
    error: null
};

export type CreateWorkoutPayload = Omit<TabataWorkout, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWorkoutPayload = Partial<Omit<TabataWorkout, 'id' | 'createdAt' | 'createdByUserId'>>;
