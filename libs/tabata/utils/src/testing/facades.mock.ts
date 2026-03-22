/**
 * Mocks for facades used in unit tests.
 * Use with provide: AuthFacade, useValue: mockAuthFacade etc.
 * Safe to load in non-test environments (uses no-ops when jest is undefined).
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

/** Mock for AuthFacade. user is a signal so authFacade.user() works. Use in any spec that provides AuthFacade. */
export const mockAuthFacade = {
    user: signal<unknown>(null),
    loginError: () => null,
    getUserError: () => null,
    sendPasswordError: () => null,
    registerError: () => null,
    updateDisplayNameError: () => null,
    updatePasswordError: () => null,
    logoutError: () => null,
    isLoading: () => false,
    isAuthenticated: () => false,
    usePassword: () => true,
    useGoogle: () => false,
    hasError: () => false,
    clearError: mockFn(),
    clearLoginError: mockFn(),
    clearRegisterError: mockFn(),
    clearSendPasswordError: mockFn(),
    sign: mockFn(),
    signWithGoogle: mockFn(),
    register: mockFn(),
    sendPasswordResetEmail: mockFn(),
    updateDisplayName: mockFn(),
    updatePassword: mockFn(),
    logout: mockFn(),
    getUser: mockFn()
};

/** Mock for UserWorkoutsFacade. Use in dashboard, history, workout-details, workout-player specs. */
export const mockUserWorkoutsFacade = {
    userWorkout: () => null,
    isLoading: () => false,
    error: () => null,
    hasUserWorkout: () => false,
    loadUserWorkout: mockFn(),
    saveUserWorkout: mockFn(),
    getOrCreateUserWorkout: mockFn()
};

/** Simple mock for WorkoutsFacade (read-only style). For writable signals use createMockWorkoutsFacade from workouts.mock. */
export const mockWorkoutsFacade = {
    workouts: () => [],
    loadedWorkout: () => null,
    isLoading: () => false,
    isSaving: () => false,
    error: () => null,
    hasWorkouts: () => false,
    loadWorkouts: mockFn(),
    loadWorkoutById: mockFn(),
    removeWorkout: mockFn()
};

/** Mock for WorkoutEditorFacade. */
export const mockWorkoutEditorFacade = {
    workoutDraft: () => ({}),
    mergedWorkout: () => ({}),
    initialDraftSnapshot: () => null,
    workout: () => null,
    isEditMode: () => false,
    canSubmitWorkout: () => false,
    hasUnsavedChanges: () => false,
    isSaveEnabled: () => false,
    loadWorkout: mockFn(),
    hydrateEditorFromWorkout: mockFn(),
    updateDraft: mockFn(),
    reset: mockFn(),
    clearDraft: mockFn()
};
