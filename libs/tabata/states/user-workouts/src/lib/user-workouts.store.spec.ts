import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { UserWorkoutsService } from './user-workouts.service';
import { UserWorkoutsStore } from './user-workouts.store';
import type { UserWorkout, UserWorkoutItem } from './user-workouts.model';

describe('UserWorkoutsStore', () => {
    let store: InstanceType<typeof UserWorkoutsStore>;
    let saveResponses: Subject<UserWorkout>[];
    let userWorkoutsService: {
        getUserWorkout: jest.Mock;
        saveUserWorkout: jest.Mock;
        getOrCreateUserWorkout: jest.Mock;
    };

    beforeEach(() => {
        saveResponses = [];
        userWorkoutsService = {
            getUserWorkout: jest.fn(() => of(null)),
            saveUserWorkout: jest.fn(() => {
                const response = new Subject<UserWorkout>();
                saveResponses.push(response);
                return response.asObservable();
            }),
            getOrCreateUserWorkout: jest.fn(() => of({ userId: 'user1', favoriteWorkouts: [], workoutItems: [] }))
        };

        TestBed.configureTestingModule({
            providers: [UserWorkoutsStore, { provide: UserWorkoutsService, useValue: userWorkoutsService }]
        });

        store = TestBed.inject(UserWorkoutsStore);
    });

    it('exposes the pending save payload before the request completes so later appends do not use stale history', () => {
        // Arrange
        const firstItem = createWorkoutItem('first-session');
        const secondItem = createWorkoutItem('second-session');
        const firstPayload = createUserWorkout([firstItem]);

        // Act
        store.saveUserWorkout(firstPayload);
        const stateAfterFirstSave = store.userWorkout();
        const secondPayload: UserWorkout = {
            ...(stateAfterFirstSave as UserWorkout),
            workoutItems: [...(stateAfterFirstSave?.workoutItems ?? []), secondItem]
        };
        store.saveUserWorkout(secondPayload);

        // Assert
        expect(stateAfterFirstSave?.workoutItems).toEqual([firstItem]);
        expect(secondPayload.workoutItems).toEqual([firstItem, secondItem]);
    });

    it('serializes save requests so a later save cannot cancel an earlier workout history write', () => {
        // Arrange
        const firstPayload = createUserWorkout([createWorkoutItem('first-session')]);
        const secondPayload = createUserWorkout([createWorkoutItem('first-session'), createWorkoutItem('second-session')]);

        // Act
        store.saveUserWorkout(firstPayload);
        store.saveUserWorkout(secondPayload);

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(1, firstPayload);
        expect(store.userWorkout()).toEqual(secondPayload);

        // Act
        saveResponses[0].next(firstPayload);
        saveResponses[0].complete();

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(2, secondPayload);
        expect(store.userWorkout()).toEqual(secondPayload);
    });

    it('keeps queued save payloads visible and ignores stale responses from older requests', () => {
        // Arrange
        const firstItem = createWorkoutItem('first-session');
        const secondItem = createWorkoutItem('second-session');
        const thirdItem = createWorkoutItem('third-session');
        const firstPayload = createUserWorkout([firstItem]);

        // Act
        store.saveUserWorkout(firstPayload);
        const secondBase = store.userWorkout();
        const secondPayload: UserWorkout = {
            ...(secondBase as UserWorkout),
            workoutItems: [...(secondBase?.workoutItems ?? []), secondItem]
        };
        store.saveUserWorkout(secondPayload);
        const thirdBase = store.userWorkout();
        const thirdPayload: UserWorkout = {
            ...(thirdBase as UserWorkout),
            workoutItems: [...(thirdBase?.workoutItems ?? []), thirdItem]
        };
        store.saveUserWorkout(thirdPayload);

        // Assert
        expect(thirdPayload.workoutItems).toEqual([firstItem, secondItem, thirdItem]);
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(1, firstPayload);

        // Act
        saveResponses[0].next(firstPayload);
        saveResponses[0].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(2, secondPayload);

        // Act
        saveResponses[1].next(secondPayload);
        saveResponses[1].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(3);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(3, thirdPayload);

        // Act
        saveResponses[2].next(thirdPayload);
        saveResponses[2].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
    });
});

function createUserWorkout(workoutItems: UserWorkoutItem[]): UserWorkout {
    return {
        userId: 'user1',
        favoriteWorkouts: [],
        workoutItems
    };
}

function createWorkoutItem(workoutId: string): UserWorkoutItem {
    return {
        workoutId,
        startedAt: `2026-01-01T00:00:00.000Z-${workoutId}`,
        finishedAt: `2026-01-01T00:10:00.000Z-${workoutId}`,
        completed: true
    };
}
