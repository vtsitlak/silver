import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutsService, type TabataWorkout } from '@silver/tabata/states/workouts';
import { WorkoutEditorInitService } from './workout-editor-init.service';

describe('WorkoutEditorInitService', () => {
    let service: WorkoutEditorInitService;
    let workoutsService: jest.Mocked<Pick<WorkoutsService, 'getWorkoutById'>>;
    let facade: jest.Mocked<Pick<WorkoutEditorFacade, 'hydrateEditorFromWorkout'>>;
    let toast: jest.Mocked<Pick<ToastService, 'showError'>>;

    const sampleWorkout = { id: 'w1', name: 'Test' } as TabataWorkout;
    const otherWorkout = { id: 'w2', name: 'Other' } as TabataWorkout;

    beforeEach(() => {
        workoutsService = { getWorkoutById: jest.fn() };
        facade = { hydrateEditorFromWorkout: jest.fn() };
        toast = { showError: jest.fn().mockResolvedValue(undefined) };

        TestBed.configureTestingModule({
            providers: [
                WorkoutEditorInitService,
                { provide: WorkoutsService, useValue: workoutsService },
                { provide: WorkoutEditorFacade, useValue: facade },
                { provide: ToastService, useValue: toast }
            ]
        });

        service = TestBed.inject(WorkoutEditorInitService);
    });

    it('should hydrate editor when workout is returned', () => {
        workoutsService.getWorkoutById.mockReturnValue(of(sampleWorkout));

        service.loadWorkoutForEditor('w1');

        expect(workoutsService.getWorkoutById).toHaveBeenCalledWith('w1');
        expect(facade.hydrateEditorFromWorkout).toHaveBeenCalledWith(sampleWorkout);
        expect(toast.showError).not.toHaveBeenCalled();
    });

    it('should toast when workout is null', () => {
        workoutsService.getWorkoutById.mockReturnValue(of(null));

        service.loadWorkoutForEditor('missing');

        expect(facade.hydrateEditorFromWorkout).not.toHaveBeenCalled();
        expect(toast.showError).toHaveBeenCalledWith('Workout not found.');
    });

    it('should toast on HTTP error', () => {
        workoutsService.getWorkoutById.mockReturnValue(throwError(() => new Error('network')));

        service.loadWorkoutForEditor('w1');

        expect(facade.hydrateEditorFromWorkout).not.toHaveBeenCalled();
        expect(toast.showError).toHaveBeenCalledWith('Could not load workout. Please try again.');
    });

    it('should ignore a stale response when a newer workout load is requested', () => {
        const first$ = new Subject<TabataWorkout | null>();
        const second$ = new Subject<TabataWorkout | null>();
        workoutsService.getWorkoutById.mockReturnValueOnce(first$.asObservable()).mockReturnValueOnce(second$.asObservable());

        service.loadWorkoutForEditor('w1');
        service.loadWorkoutForEditor('w2');

        first$.next(sampleWorkout);
        first$.complete();
        expect(facade.hydrateEditorFromWorkout).not.toHaveBeenCalled();

        second$.next(otherWorkout);
        second$.complete();
        expect(facade.hydrateEditorFromWorkout).toHaveBeenCalledTimes(1);
        expect(facade.hydrateEditorFromWorkout).toHaveBeenCalledWith(otherWorkout);
        expect(toast.showError).not.toHaveBeenCalled();
    });

    it('should ignore a stale response after cancelPendingLoad (create mode)', () => {
        const pending$ = new Subject<TabataWorkout | null>();
        workoutsService.getWorkoutById.mockReturnValue(pending$.asObservable());

        service.loadWorkoutForEditor('w1');
        service.cancelPendingLoad();

        pending$.next(sampleWorkout);
        pending$.complete();

        expect(facade.hydrateEditorFromWorkout).not.toHaveBeenCalled();
        expect(toast.showError).not.toHaveBeenCalled();
    });

    it('should ignore stale error toasts after a newer load is requested', () => {
        const first$ = new Subject<TabataWorkout | null>();
        const second$ = new Subject<TabataWorkout | null>();
        workoutsService.getWorkoutById.mockReturnValueOnce(first$.asObservable()).mockReturnValueOnce(second$.asObservable());

        service.loadWorkoutForEditor('w1');
        service.loadWorkoutForEditor('w2');

        first$.error(new Error('network'));
        expect(toast.showError).not.toHaveBeenCalled();

        second$.next(otherWorkout);
        second$.complete();
        expect(facade.hydrateEditorFromWorkout).toHaveBeenCalledWith(otherWorkout);
    });
});
