/**
 * Exercise model matching ExerciseDB API v1 (https://www.exercisedb.dev/docs)
 */
export interface Exercise {
    exerciseId: string;
    name: string;
    gifUrl: string;
    targetMuscles: string[];
    bodyParts: string[];
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

export type SortBy = 'name' | 'exerciseId' | 'targetMuscles' | 'bodyParts' | 'equipments';
export type SortOrder = 'asc' | 'desc';
