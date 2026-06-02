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

    it('keeps queued save payloads visible so later appends cannot overwrite them with stale history', () => {
        // Arrange
        const firstItem = createWorkoutItem('first-session');
        const secondItem = createWorkoutItem('second-session');
        const thirdItem = createWorkoutItem('third-session');
        const firstPayload = createUserWorkout([firstItem]);

        // Act
        store.saveUserWorkout(firstPayload);
        const stateAfterFirstSave = store.userWorkout();
        const secondPayload: UserWorkout = {
            ...(stateAfterFirstSave as UserWorkout),
            workoutItems: [...(stateAfterFirstSave?.workoutItems ?? []), secondItem]
        };
        store.saveUserWorkout(secondPayload);
        const stateAfterSecondSave = store.userWorkout();
        const thirdPayload: UserWorkout = {
            ...(stateAfterSecondSave as UserWorkout),
            workoutItems: [...(stateAfterSecondSave?.workoutItems ?? []), thirdItem]
        };
        store.saveUserWorkout(thirdPayload);

        // Assert
        expect(stateAfterSecondSave?.workoutItems).toEqual([firstItem, secondItem]);
        expect(thirdPayload.workoutItems).toEqual([firstItem, secondItem, thirdItem]);
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(1, firstPayload);

        // Act
        saveResponses[0].next(firstPayload);
        saveResponses[0].complete();

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(2, secondPayload);
        expect(store.userWorkout()).toEqual(thirdPayload);

        // Act
        saveResponses[1].next(secondPayload);
        saveResponses[1].complete();

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(3);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(3, thirdPayload);
        expect(store.userWorkout()).toEqual(thirdPayload);

        // Act
        saveResponses[2].next(thirdPayload);
        saveResponses[2].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(store.isLoading()).toBe(false);
        expect(store.error()).toBeNull();
    });

    it('does not let a refresh overwrite pending save state with stale user workout data', () => {
        // Arrange
        const completedItem = createWorkoutItem('completed-session');
        const pendingPayload = createUserWorkout([completedItem]);

        // Act
        store.saveUserWorkout(pendingPayload);
        store.getOrCreateUserWorkout('user1');
        const nextPayload: UserWorkout = {
            ...(store.userWorkout() as UserWorkout),
            favoriteWorkouts: ['favorite-workout']
        };
        store.saveUserWorkout(nextPayload);

        // Assert
        expect(userWorkoutsService.getOrCreateUserWorkout).not.toHaveBeenCalled();
        expect(nextPayload.workoutItems).toEqual([completedItem]);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(1, pendingPayload);

        // Act
        saveResponses[0].next(pendingPayload);
        saveResponses[0].complete();
        saveResponses[1].next(nextPayload);
        saveResponses[1].complete();

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(2, nextPayload);
        expect(store.userWorkout()).toEqual(nextPayload);
    });

    it('ignores refresh responses that started before a newer save', () => {
        // Arrange
        const refreshResponse = new Subject<UserWorkout | null>();
        userWorkoutsService.getUserWorkout.mockReturnValueOnce(refreshResponse.asObservable());
        const pendingPayload = createUserWorkout([createWorkoutItem('completed-session')]);
        const stalePayload = createUserWorkout([]);

        // Act
        store.getOrCreateUserWorkout('user1');
        store.saveUserWorkout(pendingPayload);
        saveResponses[0].next(pendingPayload);
        saveResponses[0].complete();
        refreshResponse.next(stalePayload);
        refreshResponse.complete();

        // Assert
        expect(store.userWorkout()).toEqual(pendingPayload);
        expect(store.isLoading()).toBe(false);
    });

    it('creates missing user workout records through the serialized save queue', () => {
        // Arrange
        const loadResponse = new Subject<UserWorkout | null>();
        const emptyPayload = createUserWorkout([]);
        userWorkoutsService.getUserWorkout.mockReturnValueOnce(loadResponse.asObservable());

        // Act
        store.getOrCreateUserWorkout('user1');
        loadResponse.next(null);
        loadResponse.complete();

        // Assert
        expect(userWorkoutsService.getUserWorkout).toHaveBeenCalledWith('user1');
        expect(userWorkoutsService.getOrCreateUserWorkout).not.toHaveBeenCalled();
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(1, emptyPayload);

        // Act
        saveResponses[0].next(emptyPayload);
        saveResponses[0].complete();

        // Assert
        expect(store.userWorkout()).toEqual(emptyPayload);
        expect(store.isLoading()).toBe(false);
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
