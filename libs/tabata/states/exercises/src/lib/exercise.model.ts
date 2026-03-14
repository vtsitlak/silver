/**
 * Exercise model; images array matches free-exercise-db (list shows first, details show all).
 */
export interface Exercise {
    exerciseId: string;
    name: string;
    images: string[];
    targetMuscles: string[];
    category: string[];
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

export type SortBy = 'name' | 'exerciseId' | 'targetMuscles' | 'category' | 'equipments';
export type SortOrder = 'asc' | 'desc';
