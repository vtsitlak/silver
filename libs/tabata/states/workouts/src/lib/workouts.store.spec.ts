import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { mockTabataWorkout } from '@silver/tabata/testing';
import { WorkoutsService } from './workouts.service';
import { WorkoutsStore } from './workouts.store';
import type { TabataWorkout } from './workouts.models';

describe('WorkoutsStore', () => {
    let store: InstanceType<typeof WorkoutsStore>;
    let getWorkoutByIdResponses: Subject<TabataWorkout | null>[];
    let workoutsService: {
        getWorkouts: jest.Mock;
        getWorkoutById: jest.Mock;
        deleteWorkout: jest.Mock;
        createWorkout: jest.Mock;
        updateWorkout: jest.Mock;
    };

    beforeEach(() => {
        getWorkoutByIdResponses = [];
        workoutsService = {
            getWorkouts: jest.fn(() => of([])),
            getWorkoutById: jest.fn(() => {
                const response = new Subject<TabataWorkout | null>();
                getWorkoutByIdResponses.push(response);
                return response.asObservable();
            }),
            deleteWorkout: jest.fn(() => of({ success: true })),
            createWorkout: jest.fn(() => of(mockTabataWorkout)),
            updateWorkout: jest.fn(() => of(mockTabataWorkout))
        };

        TestBed.configureTestingModule({
            providers: [WorkoutsStore, { provide: WorkoutsService, useValue: workoutsService }]
        });

        store = TestBed.inject(WorkoutsStore);
    });

    it('clears a previously loaded workout as soon as a new id load starts', () => {
        // Arrange
        const previous = { ...mockTabataWorkout, id: 'workout-a', name: 'Workout A' };
        store.loadWorkoutById('workout-a');
        getWorkoutByIdResponses[0].next(previous);
        getWorkoutByIdResponses[0].complete();
        expect(store.loadedWorkout()?.id).toBe('workout-a');

        // Act
        store.loadWorkoutById('workout-b');

        // Assert — stale workout must not remain while B is in flight
        expect(store.isLoading()).toBe(true);
        expect(store.loadedWorkout()).toBeNull();
        expect(store.error()).toBeNull();
    });

    it('sets a not-found error when getWorkoutById returns null', () => {
        // Arrange / Act
        store.loadWorkoutById('missing-workout');
        getWorkoutByIdResponses[0].next(null);
        getWorkoutByIdResponses[0].complete();

        // Assert
        expect(store.isLoading()).toBe(false);
        expect(store.loadedWorkout()).toBeNull();
        expect(store.error()).toBe('Workout not found');
    });
});
