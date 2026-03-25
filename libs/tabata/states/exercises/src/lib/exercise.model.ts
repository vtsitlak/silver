/**
 * Exercise model; images array matches free-exercise-db (list shows first, details show all).
 */
export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert';

export const EXERCISE_LEVEL_OPTIONS: ExerciseLevel[] = ['beginner', 'intermediate', 'expert'];

export interface Exercise {
    exerciseId: string;
    name: string;
    images: string[];
    targetMuscles: string[];
    /** e.g. strength, stretching, cardio (from API; stored as array for filters). */
    category: string[];
    /** e.g. beginner, intermediate, expert (free-exercise-db / ExerciseDB). */
    level?: string;
    equipments: string[];
    secondaryMuscles: string[];
    instructions: string[];
}

export interface ExerciseListMetadata {
    totalExercises: number;
    totalPages: number;
    currentPage: number;
    previousPage: string;
    nextPage: string;
}

export interface ExerciseListResponse {
    success: boolean;
    data: Exercise[];
    metadata?: ExerciseListMetadata;
}

export interface ExerciseSingleResponse {
    success: boolean;
    data: Exercise;
}

export interface NameListResponse {
    success: boolean;
    data: { name: string }[];
}

export type SortBy = 'name' | 'exerciseId' | 'targetMuscles' | 'category' | 'equipments' | 'level';
export type SortOrder = 'asc' | 'desc';
