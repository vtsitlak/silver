/**
 * Shared mocks for workouts and exercises used in unit tests (e.g. workout-details, workouts list).
 * Import via @silver/tabata/testing.
 */
/// <reference types="jest" />

import { signal } from '@angular/core';

function mockFn(): jest.Mock {
    return typeof jest !== 'undefined'
        ? jest.fn()
        : ((() => {
              return;
          }) as unknown as jest.Mock);
}

/** Minimal workout shape for testing (structurally compatible with TabataWorkout). */
export const mockTabataWorkout = {
    id: '1',
    name: 'Test Workout',
    description: 'A test workout description',
    totalDurationMinutes: 30,
    blocks: [
        {
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'Burpees',
            interBlockRestSeconds: 60
        }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedByUserId: 'user1',
    createdByUserId: 'user1',
    generatedByAi: false,
    warmup: {
        movements: [],
        totalDurationSeconds: 0
    },
    cooldown: {
        movements: [],
        totalDurationSeconds: 0
    },
    mainTargetBodypart: 'Upper Body' as const,
    secondaryTargetBodyparts: [] as string[],
    availableEquipments: [] as unknown[]
};

/** Creates a mock WorkoutsFacade with writable signals. Call in beforeEach for a fresh instance. */
export function createMockWorkoutsFacade(): {
    workouts: ReturnType<typeof signal>;
    loadedWorkout: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadWorkouts: jest.Mock;
    loadWorkoutById: jest.Mock;
} {
    const workout = { ...mockTabataWorkout };
    const loadedWorkout = signal<typeof workout | null>(workout);
    const workouts = signal([workout]);
    const isLoading = signal(false);
    const error = signal<string | null>(null);
    const loadWorkouts = mockFn();
    const loadWorkoutById =
        typeof jest !== 'undefined'
            ? jest.fn((id: string) => {
                  if (id === 'non-existent') {
                      loadedWorkout.set(null);
                  }
              })
            : mockFn();
    return {
        workouts,
        loadedWorkout,
        isLoading,
        error,
        loadWorkouts,
        loadWorkoutById
    };
}

/** Minimal exercise shape for testing (structurally compatible with Exercise from states/exercises). */
export const mockExercise = {
    exerciseId: 'Burpees',
    name: 'Burpees',
    images: ['https://example.com/burpee.gif'] as string[],
    targetMuscles: [] as string[],
    category: [] as string[],
    equipments: [] as string[],
    secondaryMuscles: [] as string[],
    instructions: [] as string[]
};

/** Creates a mock ExercisesFacade. Call in beforeEach for a fresh instance. */
export function createMockExercisesFacade(): {
    exercisesMap: ReturnType<typeof signal>;
    loadExercisesMap: jest.Mock;
} {
    return {
        exercisesMap: signal<Record<string, typeof mockExercise>>({ Burpees: mockExercise }),
        loadExercisesMap: mockFn()
    };
}

/** Default mock exercises array for selector modal / list tests. */
export const mockExercisesArray = [
    {
        exerciseId: '1',
        name: 'Push Up',
        images: [] as string[],
        targetMuscles: ['chest'],
        category: ['upper body'],
        equipments: ['body weight'],
        secondaryMuscles: [] as string[],
        instructions: [] as string[]
    }
];

/** Creates a mock ExercisesFacade for exercise-selector modal (exercises as signal of array). */
export function createMockExercisesFacadeForSelector(initialExercises = mockExercisesArray): {
    exercises: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    musclesList: ReturnType<typeof signal>;
    equipmentList: ReturnType<typeof signal>;
    categoryList: ReturnType<typeof signal>;
    getAllExercises: jest.Mock;
    filterExercises: jest.Mock;
    getMusclesList: jest.Mock;
    getEquipmentList: jest.Mock;
    getCategoryList: jest.Mock;
} {
    return {
        exercises: signal([...initialExercises]),
        isLoading: signal(false),
        error: signal<string | null>(null),
        musclesList: signal([]),
        equipmentList: signal([]),
        categoryList: signal([]),
        getAllExercises: mockFn(),
        filterExercises: mockFn(),
        getMusclesList: mockFn(),
        getEquipmentList: mockFn(),
        getCategoryList: mockFn()
    };
}
