import type { BodyRegion, EquipmentCategory } from '@silver/shared/helpers';

// Workout and store state models for tabata-workouts.
export interface WorkoutsState {
    workouts: TabataWorkout[];
    isLoading: boolean;
    error: string | null;
}

export const workoutsInitialState: WorkoutsState = {
    workouts: [],
    isLoading: false,
    error: null
};

/**
 * Represents the entire Tabata session structure.
 */
export interface TabataWorkout {
    id: string;
    name: string;
    description?: string;
    totalDurationMinutes: number;
    warmup?: Phase;
    blocks: TabataBlock[];
    cooldown?: Phase;
    script?: string;
    createdAt: string;
    updatedAt?: string;
    updatedByUserId: string;
    createdByUserId: string;
    generatedByAi: boolean;
    targetMuscles: string[];
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
