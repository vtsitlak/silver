/**
 * Mocks for services used in unit tests (cancel, toast, action sheet, submit).
 * Import via @silver/tabata/testing.
 */
/// <reference types="jest" />

import { of } from 'rxjs';

function mockFn(): jest.Mock {
    return typeof jest !== 'undefined'
        ? jest.fn()
        : ((() => {
              return;
          }) as unknown as jest.Mock);
}

/** Mock for WorkoutEditorCancelService. */
export function createMockWorkoutEditorCancelService(confirmResult = false): { confirmCancel: jest.Mock } {
    return {
        confirmCancel: mockFn().mockResolvedValue(confirmResult)
    };
}

/** Mock for ToastService (showSuccess, showError). */
export const mockToastService = {
    showSuccess: mockFn(),
    showError: mockFn()
};

/** Mock for ActionSheetController. */
export const mockActionSheetController = {
    create:
        typeof jest !== 'undefined'
            ? jest.fn().mockResolvedValue({
                  present: jest.fn(),
                  onDidDismiss: jest.fn().mockResolvedValue({ data: undefined })
              })
            : ((() =>
                Promise.resolve({
                    present: () => { return; },
                    onDidDismiss: Promise.resolve({ data: undefined })
                })) as unknown as jest.Mock)
};

/** Mock for WorkoutSubmitService (submitWorkout returns an observable). */
export function createMockWorkoutSubmitService(): { submitWorkout: jest.Mock } {
    return {
        submitWorkout: mockFn().mockReturnValue(of({}))
    };
}
