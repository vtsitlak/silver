import type { BodyRegion, EquipmentCategory } from '@silver/tabata/helpers';

// Workout and store state models for tabata-workouts.
export interface WorkoutsState {
    workouts: TabataWorkout[];
    /** Single workout loaded by id (e.g. for details view). Cleared when loading list. */
    loadedWorkout: TabataWorkout | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

export const workoutsInitialState: WorkoutsState = {
    workouts: [],
    loadedWorkout: null,
    isLoading: false,
    isSaving: false,
    error: null
};

/**
 * Represents the entire Tabata session structure.
 */
export interface TabataWorkout {
    id: string;
    name: string;
    description: string;
    totalDurationMinutes: number;
    warmup: Phase;
    blocks: TabataBlock[];
    cooldown: Phase;
    script?: string;
    createdAt: string;
    updatedAt: string;
    updatedByUserId: string;
    createdByUserId: string;
    generatedByAi: boolean;
    mainTargetBodypart: BodyRegion;
    secondaryTargetBodyparts: BodyRegion[];
    availableEquipments: EquipmentCategory[];
}

/**
 * A standard phase (Warmup/Cooldown) consisting of continuous movements.
 */
export interface Phase {
    totalDurationSeconds: number;
    movements: ExerciseItem[];
}

/**
 * A specific 4-minute Tabata Block.
 */
export interface TabataBlock {
    rounds: number; // Usually 8
    workDurationSeconds: number; // Usually 20
    restDurationSeconds: number; // Usually 10
    exerciseId: string;
    interBlockRestSeconds: number; // Recovery time after the 8 rounds (e.g., 60s)
}

/**
 * Individual exercise details for phases.
 */
export interface ExerciseItem {
    exerciseId: string;
    durationSeconds: number;
}

export type WorkoutInfo = Pick<TabataWorkout, 'name' | 'description' | 'generatedByAi' | 'mainTargetBodypart' | 'secondaryTargetBodyparts' | 'availableEquipments'>;

export type WorkoutInfoFormModel = Omit<WorkoutInfo, 'mainTargetBodypart'> & {
    mainTargetBodypart: BodyRegion | null;
};

export type CreateWorkoutPayload = Omit<TabataWorkout, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateWorkoutPayload = Partial<Omit<TabataWorkout, 'id' | 'createdAt' | 'createdByUserId'>>;
