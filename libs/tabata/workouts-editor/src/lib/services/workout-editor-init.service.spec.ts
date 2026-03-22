import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
});
