/**
 * Mocks for facades used in unit tests.
 * Use with provide: AuthFacade, useValue: mockAuthFacade etc.
 * Safe to load in non-test environments (uses no-ops when jest is undefined).
 */
/// <reference types="jest" />

function mockFn(): jest.Mock {
    return typeof jest !== 'undefined'
        ? jest.fn()
        : ((() => {
              return;
          }) as unknown as jest.Mock);
}

/** Mock for AuthFacade (e.g. when testing components that use ToolbarComponent). */
export const mockAuthFacade = {
    logout: mockFn()
};

/** Mock for WorkoutEditorFacade. */
export const mockWorkoutEditorFacade = {
    workoutDraft: () => ({}),
    mergedWorkout: () => ({}),
    workout: () => null,
    isEditMode: () => false,
    isSaving: () => false,
    loadWorkout: mockFn(),
    updateDraft: mockFn(),
    clearDraft: mockFn(),
    initDraftFromWorkout: mockFn()
};
