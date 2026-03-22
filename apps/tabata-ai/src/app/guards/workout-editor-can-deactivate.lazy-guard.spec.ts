import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { workoutEditorCanDeactivateGuard } from './workout-editor-can-deactivate.lazy-guard';

const mockImpl = jest.fn();
jest.mock('@silver/tabata/workouts-editor', () => ({
    workoutEditorCanDeactivateGuard: (...args: unknown[]) => mockImpl(...args)
}));

describe('workoutEditorCanDeactivateGuard (lazy)', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const nextState = {} as RouterStateSnapshot;

    beforeEach(() => {
        mockImpl.mockReset();
        TestBed.configureTestingModule({});
    });

    it('should delegate to the workouts-editor guard and return its result', async () => {
        mockImpl.mockResolvedValue(true);

        const result = await TestBed.runInInjectionContext(() => workoutEditorCanDeactivateGuard({} as never, route, state, nextState));

        expect(mockImpl).toHaveBeenCalledTimes(1);
        expect(mockImpl).toHaveBeenCalledWith({}, route, state, nextState);
        expect(result).toBe(true);
    });
});
