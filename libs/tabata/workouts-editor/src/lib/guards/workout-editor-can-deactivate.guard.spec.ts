import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot, type Navigation, type RouterStateSnapshot } from '@angular/router';
import { workoutEditorCanDeactivateGuard, SKIP_WORKOUT_EDITOR_CANCEL } from './workout-editor-can-deactivate.guard';
import { WorkoutEditorCancelService } from '../services/workout-editor-cancel.service';
import type { WorkoutEditorComponent } from '../components/workout-editor/workout-editor.component';

describe('workoutEditorCanDeactivateGuard', () => {
    let cancelService: { confirmCancel: jest.Mock };
    let router: Router;

    const component = {} as WorkoutEditorComponent;
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const nextState = {} as RouterStateSnapshot;

    beforeEach(() => {
        cancelService = { confirmCancel: jest.fn() };
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: WorkoutEditorCancelService, useValue: cancelService }]
        });
        router = TestBed.inject(Router);
    });

    it('should allow deactivate when navigation state skips confirm', () => {
        jest.spyOn(router, 'currentNavigation').mockReturnValue({
            extras: { state: { [SKIP_WORKOUT_EDITOR_CANCEL]: true } }
        } as unknown as Navigation);

        const result = TestBed.runInInjectionContext(() => workoutEditorCanDeactivateGuard(component, route, state, nextState));
        expect(result).toBe(true);
        expect(cancelService.confirmCancel).not.toHaveBeenCalled();
    });

    it('should call confirmCancel and allow when user leaves', async () => {
        jest.spyOn(router, 'currentNavigation').mockReturnValue({
            extras: { state: {} }
        } as unknown as Navigation);
        cancelService.confirmCancel.mockResolvedValue(false);

        const result = TestBed.runInInjectionContext(() => workoutEditorCanDeactivateGuard(component, route, state, nextState));
        await expect(result).resolves.toBe(true);
        expect(cancelService.confirmCancel).toHaveBeenCalled();
    });

    it('should call confirmCancel and block when user stays', async () => {
        jest.spyOn(router, 'currentNavigation').mockReturnValue({
            extras: { state: {} }
        } as unknown as Navigation);
        cancelService.confirmCancel.mockResolvedValue(true);

        const result = TestBed.runInInjectionContext(() => workoutEditorCanDeactivateGuard(component, route, state, nextState));
        await expect(result).resolves.toBe(false);
    });
});
