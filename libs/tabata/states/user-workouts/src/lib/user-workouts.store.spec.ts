import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { USER_WORKOUTS_ACTIVE_USER_ID } from './user-workouts-active-user-id';
import { UserWorkoutsService } from './user-workouts.service';
import { UserWorkoutsStore } from './user-workouts.store';
import type { UserWorkout, UserWorkoutItem } from './user-workouts.model';

describe('UserWorkoutsStore', () => {
    let store: InstanceType<typeof UserWorkoutsStore>;
    let activeUserId: WritableSignal<string | null>;
    let saveResponses: Subject<UserWorkout>[];
    let userWorkoutsService: {
        getUserWorkout: jest.Mock;
        saveUserWorkout: jest.Mock;
        getOrCreateUserWorkout: jest.Mock;
    };

    beforeEach(() => {
        activeUserId = signal<string | null>('user1');
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
            providers: [
                UserWorkoutsStore,
                { provide: USER_WORKOUTS_ACTIVE_USER_ID, useValue: activeUserId },
                { provide: UserWorkoutsService, useValue: userWorkoutsService }
            ]
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

    it('exposes every queued save payload before older requests complete so repeated appends do not drop history', () => {
        // Arrange
        const firstItem = createWorkoutItem('first-session');
        const secondItem = createWorkoutItem('second-session');
        const thirdItem = createWorkoutItem('third-session');
        const firstPayload = createUserWorkout([firstItem]);

        // Act
        store.saveUserWorkout(firstPayload);
        const stateAfterFirstSave = store.userWorkout();
        const secondPayload = createUserWorkout([...(stateAfterFirstSave?.workoutItems ?? []), secondItem]);
        store.saveUserWorkout(secondPayload);
        const stateAfterSecondSave = store.userWorkout();
        const thirdPayload = createUserWorkout([...(stateAfterSecondSave?.workoutItems ?? []), thirdItem]);
        store.saveUserWorkout(thirdPayload);

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(stateAfterSecondSave?.workoutItems).toEqual([firstItem, secondItem]);
        expect(thirdPayload.workoutItems).toEqual([firstItem, secondItem, thirdItem]);
        expect(store.userWorkout()).toEqual(thirdPayload);

        // Act
        saveResponses[0].next(firstPayload);
        saveResponses[0].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);

        // Act
        saveResponses[1].next(secondPayload);
        saveResponses[1].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(3);

        // Act
        saveResponses[2].next(thirdPayload);
        saveResponses[2].complete();

        // Assert
        expect(store.userWorkout()).toEqual(thirdPayload);
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

    it('ignores stale responses from older saves while newer payloads are queued', () => {
        // Arrange
        const firstPayload = createUserWorkout([createWorkoutItem('first-session')]);
        const secondPayload = createUserWorkout([createWorkoutItem('first-session'), createWorkoutItem('second-session')]);

        // Act
        store.saveUserWorkout(firstPayload);
        store.saveUserWorkout(secondPayload);
        saveResponses[0].next(firstPayload);
        saveResponses[0].complete();

        // Assert
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
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

    it('keeps failed session saves and retries them instead of letting History GET wipe the session', () => {
        // Arrange — player finished a session; PUT fails (offline / 500)
        const completedItem = createWorkoutItem('completed-session');
        const failedPayload = createUserWorkout([completedItem]);

        // Act
        store.saveUserWorkout(failedPayload);
        saveResponses[0].error(new Error('Network error'));

        // Assert — failure keeps optimistic session and records the error
        expect(store.userWorkout()).toEqual(failedPayload);
        expect(store.error()).toBe('Network error');

        // Act — History/Dashboard enter calls getOrCreate; must retry save, not GET-stomp.
        store.getOrCreateUserWorkout('user1');

        // Assert — no GET; failed payload requeued (retry clears error while in-flight)
        expect(store.userWorkout()).toEqual(failedPayload);
        expect(userWorkoutsService.getUserWorkout).not.toHaveBeenCalled();
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(2, failedPayload);

        // Act — retry succeeds
        saveResponses[1].next(failedPayload);
        saveResponses[1].complete();

        // Assert
        expect(store.userWorkout()).toEqual(failedPayload);
        expect(store.error()).toBeNull();
        expect(store.isLoading()).toBe(false);
    });

    it('does not apply a late GET over a failed unsynced session payload', () => {
        // Arrange
        const completedItem = createWorkoutItem('completed-session');
        const failedPayload = createUserWorkout([completedItem]);
        const staleServerPayload = createUserWorkout([]);
        const refreshResponse = new Subject<UserWorkout | null>();
        userWorkoutsService.getUserWorkout.mockReturnValueOnce(refreshResponse.asObservable());

        // Act — start a refresh, then a save fails before the GET returns
        store.getOrCreateUserWorkout('user1');
        store.saveUserWorkout(failedPayload);
        saveResponses[0].error(new Error('Network error'));
        refreshResponse.next(staleServerPayload);
        refreshResponse.complete();

        // Assert — failed optimistic payload wins over the late stale GET
        expect(store.userWorkout()).toEqual(failedPayload);
        expect(store.error()).toBe('Network error');
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

    it('clears user workout state and ignores in-flight save responses when the active user changes', () => {
        // Arrange
        const userOnePayload = createUserWorkout([createWorkoutItem('user-one-session')], 'user1');

        // Act
        store.saveUserWorkout(userOnePayload);
        activeUserId.set(null);
        flushSignalEffects();
        saveResponses[0].next(userOnePayload);
        saveResponses[0].complete();

        // Assert
        expect(store.userWorkout()).toBeNull();
        expect(store.isLoading()).toBe(false);
        expect(store.error()).toBeNull();
    });

    it('ignores stale previous-user loads while allowing the next user to hydrate', () => {
        // Arrange
        const userOneResponse = new Subject<UserWorkout | null>();
        const userTwoResponse = new Subject<UserWorkout | null>();
        const userOnePayload = createUserWorkout([createWorkoutItem('user-one-session')], 'user1');
        const userTwoPayload = createUserWorkout([createWorkoutItem('user-two-session')], 'user2');
        userWorkoutsService.getUserWorkout
            .mockReturnValueOnce(userOneResponse.asObservable())
            .mockReturnValueOnce(userTwoResponse.asObservable());

        // Act
        store.getOrCreateUserWorkout('user1');
        activeUserId.set('user2');
        flushSignalEffects();
        store.getOrCreateUserWorkout('user2');
        userOneResponse.next(userOnePayload);
        userOneResponse.complete();
        userTwoResponse.next(userTwoPayload);
        userTwoResponse.complete();

        // Assert
        expect(store.userWorkout()).toEqual(userTwoPayload);
        expect(store.isLoading()).toBe(false);
    });

    it('appendWorkoutSession saves immediately when user workout is already hydrated', () => {
        // Arrange
        const existingItem = createWorkoutItem('existing-session');
        const newItem = createWorkoutItem('new-session');
        const existing = createUserWorkout([existingItem]);
        store.saveUserWorkout(existing);
        saveResponses[0].next(existing);
        saveResponses[0].complete();

        // Act
        store.appendWorkoutSession('user1', newItem);

        // Assert
        expect(store.hasPendingSessionAppends()).toBe(false);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(2);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                userId: 'user1',
                workoutItems: [existingItem, newItem]
            })
        );
    });

    it('buffers appendWorkoutSession until hydration and merges into the loaded record', () => {
        // Arrange
        const loadResponse = new Subject<UserWorkout | null>();
        const existingItem = createWorkoutItem('existing-session');
        const newItem = createWorkoutItem('completed-session');
        const existing = createUserWorkout([existingItem]);
        userWorkoutsService.getUserWorkout.mockReturnValueOnce(loadResponse.asObservable());

        // Act — simulate player finish before getOrCreate returns, then component teardown
        store.appendWorkoutSession('user1', newItem);

        // Assert
        expect(store.hasPendingSessionAppends()).toBe(true);
        expect(userWorkoutsService.saveUserWorkout).not.toHaveBeenCalled();
        expect(userWorkoutsService.getUserWorkout).toHaveBeenCalledWith('user1');

        // Act
        loadResponse.next(existing);
        loadResponse.complete();

        // Assert
        expect(store.hasPendingSessionAppends()).toBe(false);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledTimes(1);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledWith(
            expect.objectContaining({
                favoriteWorkouts: existing.favoriteWorkouts,
                workoutItems: [existingItem, newItem]
            })
        );
    });

    it('includes buffered session appends when creating a missing user workout record', () => {
        // Arrange
        const loadResponse = new Subject<UserWorkout | null>();
        const newItem = createWorkoutItem('completed-session');
        userWorkoutsService.getUserWorkout.mockReturnValueOnce(loadResponse.asObservable());

        // Act
        store.appendWorkoutSession('user1', newItem);
        loadResponse.next(null);
        loadResponse.complete();

        // Assert
        expect(store.hasPendingSessionAppends()).toBe(false);
        expect(userWorkoutsService.saveUserWorkout).toHaveBeenCalledWith({
            userId: 'user1',
            favoriteWorkouts: [],
            workoutItems: [newItem]
        });
    });
});

function createUserWorkout(workoutItems: UserWorkoutItem[], userId = 'user1'): UserWorkout {
    return {
        userId,
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

function flushSignalEffects(): void {
    TestBed.flushEffects();
}
