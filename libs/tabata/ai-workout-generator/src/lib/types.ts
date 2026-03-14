import type { BodyRegion, EquipmentCategory } from '@silver/tabata/helpers';

/** Input for the AI workout generation API (matches workout info form + exercise list). */
export interface GenerateWorkoutInput {
    name: string;
    description: string;
    mainTargetBodypart: BodyRegion;
    availableEquipments: EquipmentCategory[];
    secondaryTargetBodyparts: BodyRegion[];
    /** Exercise summaries for the model to choose from (ids must exist in your DB). */
    exercises: ExerciseSummary[];
}

/** Minimal exercise data sent to the AI for context. */
export interface ExerciseSummary {
    exerciseId: string;
    name: string;
    targetMuscles: string[];
    category: string[];
    equipments: string[];
}

/** Generated structure returned by the API (no id, timestamps, or userIds). */
export interface GenerateWorkoutOutput {
    totalDurationMinutes: number;
    warmup: {
        totalDurationSeconds: number;
        movements: { exerciseId: string; durationSeconds: number }[];
    };
    blocks: {
        rounds: number;
        workDurationSeconds: number;
        restDurationSeconds: number;
        exerciseId: string;
        interBlockRestSeconds: number;
    }[];
    cooldown: {
        totalDurationSeconds: number;
        movements: { exerciseId: string; durationSeconds: number }[];
    };
}
