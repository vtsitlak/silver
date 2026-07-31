import { computed, effect, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap, switchMap, concatMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { userWorkoutsInitialState, type UserWorkoutsState } from './user-workouts.model';
import { UserWorkoutsService } from './user-workouts.service';
import type { UserWorkout, UserWorkoutItem } from './user-workouts.model';
import { USER_WORKOUTS_ACTIVE_USER_ID } from './user-workouts-active-user-id';

interface SaveUserWorkoutRequest {
    requestId: number;
    userWorkout: UserWorkout;
}

interface UserWorkoutLoadRequest {
    userId: string;
    revision: number;
}

interface PendingSessionAppend {
    userId: string;
    item: UserWorkoutItem;
}

export const UserWorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<UserWorkoutsState>(userWorkoutsInitialState),
    withComputed(({ userWorkout, pendingSessionAppendCount }) => ({
        hasUserWorkout: computed(() => userWorkout() !== null),
        hasPendingSessionAppends: computed(() => pendingSessionAppendCount() > 0)
    })),
    withMethods((store, userWorkoutsService = inject(UserWorkoutsService), activeUserIdSignal = inject(USER_WORKOUTS_ACTIVE_USER_ID)) => {
        const loadTrigger = new Subject<UserWorkoutLoadRequest>();
        const saveTrigger = new Subject<SaveUserWorkoutRequest>();
        const getOrCreateTrigger = new Subject<UserWorkoutLoadRequest>();
        let latestSaveRequestId = 0;
        let userWorkoutRevision = 0;
        let activeUserId = activeUserIdSignal();
        const latestPendingSaveByUserId = new Map<string, number>();
        let pendingSessionAppends: PendingSessionAppend[] = [];

        const hasPendingSaveForUser = (userId: string): boolean => latestPendingSaveByUserId.has(userId);
        const isActiveUser = (userId: string): boolean => activeUserId === userId;

        const syncPendingSessionAppendCount = (): void => {
            patchState(store, { pendingSessionAppendCount: pendingSessionAppends.length });
        };

        const resetUserWorkoutState = (): void => {
            latestSaveRequestId += 1;
            userWorkoutRevision += 1;
            latestPendingSaveByUserId.clear();
            pendingSessionAppends = [];
            patchState(store, userWorkoutsInitialState);
        };

        effect(() => {
            const userId = activeUserIdSignal();
            if (userId === activeUserId) return;
            activeUserId = userId;
            resetUserWorkoutState();
        });

        const queueSaveUserWorkout = (userWorkout: UserWorkout): void => {
            if (!isActiveUser(userWorkout.userId)) return;

            const requestId = latestSaveRequestId + 1;
            latestSaveRequestId = requestId;
            userWorkoutRevision += 1;
            latestPendingSaveByUserId.set(userWorkout.userId, requestId);
            patchState(store, { userWorkout, isLoading: true, error: null });
            saveTrigger.next({ requestId, userWorkout });
        };

        const takePendingSessionAppends = (userId: string): UserWorkoutItem[] => {
            const items = pendingSessionAppends.filter((entry) => entry.userId === userId).map((entry) => entry.item);
            if (items.length === 0) return [];
            pendingSessionAppends = pendingSessionAppends.filter((entry) => entry.userId !== userId);
            syncPendingSessionAppendCount();
            return items;
        };

        const userWorkoutWithPendingAppends = (base: UserWorkout): UserWorkout => {
            const pendingItems = takePendingSessionAppends(base.userId);
            if (pendingItems.length === 0) return base;
            return {
                userId: base.userId,
                favoriteWorkouts: base.favoriteWorkouts ?? [],
                workoutItems: [...(base.workoutItems ?? []), ...pendingItems]
            };
        };

        const applyLoadedUserWorkout = ({ userId, revision }: UserWorkoutLoadRequest, userWorkout: UserWorkout | null): void => {
            if (!isActiveUser(userId) || revision !== userWorkoutRevision || hasPendingSaveForUser(userId)) {
                return;
            }
            if (!userWorkout) {
                patchState(store, { userWorkout: null, isLoading: false });
                return;
            }

            const merged = userWorkoutWithPendingAppends(userWorkout);
            if (merged !== userWorkout) {
                queueSaveUserWorkout(merged);
                return;
            }
            patchState(store, { userWorkout, isLoading: false });
        };

        rxMethod<UserWorkoutLoadRequest>((request$) =>
            request$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((request) => {
                    const { userId } = request;
                    return userWorkoutsService.getUserWorkout(userId).pipe(
                        tapResponse({
                            next: (userWorkout) => applyLoadedUserWorkout(request, userWorkout ?? null),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                isLoading: false
                            });
                            return of(null);
                        })
                    );
                })
            )
        )(loadTrigger);

        rxMethod<SaveUserWorkoutRequest>((request$) =>
            request$.pipe(
                concatMap(({ requestId, userWorkout }) =>
                    userWorkoutsService.saveUserWorkout(userWorkout).pipe(
                        tapResponse({
                            next: (saved) => {
                                if (requestId === latestSaveRequestId && isActiveUser(saved.userId)) {
                                    patchState(store, { userWorkout: saved, isLoading: false, error: null });
                                }
                            },
                            error: (err: Error) => {
                                if (requestId === latestSaveRequestId) {
                                    patchState(store, { error: err.message, isLoading: false });
                                }
                            }
                        }),
                        catchError((err: unknown) => {
                            if (requestId === latestSaveRequestId) {
                                patchState(store, {
                                    error: err instanceof Error ? err.message : String(err),
                                    isLoading: false
                                });
                            }
                            return of(null as unknown as UserWorkout);
                        }),
                        finalize(() => {
                            if (latestPendingSaveByUserId.get(userWorkout.userId) === requestId) {
                                latestPendingSaveByUserId.delete(userWorkout.userId);
                            }
                            // Hydration/save races can leave session appends buffered; flush once the queue is free.
                            const current = store.userWorkout();
                            if (
                                current?.userId === userWorkout.userId &&
                                isActiveUser(userWorkout.userId) &&
                                !hasPendingSaveForUser(userWorkout.userId)
                            ) {
                                const merged = userWorkoutWithPendingAppends(current);
                                if (merged !== current) {
                                    queueSaveUserWorkout(merged);
                                }
                            }
                        })
                    )
                )
            )
        )(saveTrigger);

        rxMethod<UserWorkoutLoadRequest>((request$) =>
            request$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((request) => {
                    const { userId } = request;
                    return userWorkoutsService.getUserWorkout(userId).pipe(
                        tapResponse({
                            next: (userWorkout) => {
                                if (userWorkout) {
                                    applyLoadedUserWorkout(request, userWorkout);
                                    return;
                                }
                                if (request.revision !== userWorkoutRevision || hasPendingSaveForUser(userId)) {
                                    return;
                                }
                                const emptyBase: UserWorkout = { userId, favoriteWorkouts: [], workoutItems: [] };
                                queueSaveUserWorkout(userWorkoutWithPendingAppends(emptyBase));
                            },
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                isLoading: false
                            });
                            return of(null as unknown as UserWorkout);
                        })
                    );
                })
            )
        )(getOrCreateTrigger);

        return {
            loadUserWorkout: (userId: string) => {
                if (!isActiveUser(userId) || hasPendingSaveForUser(userId)) return;
                loadTrigger.next({ userId, revision: userWorkoutRevision });
            },
            saveUserWorkout: queueSaveUserWorkout,
            getOrCreateUserWorkout: (userId: string) => {
                if (!isActiveUser(userId) || hasPendingSaveForUser(userId)) return;
                getOrCreateTrigger.next({ userId, revision: userWorkoutRevision });
            },
            /**
             * Append a finished/cancelled workout session.
             * If the user workout is not hydrated yet, buffers the item in store state so player
             * teardown (e.g. OS/browser back) cannot drop the completed session.
             */
            appendWorkoutSession: (userId: string, item: UserWorkoutItem): void => {
                if (!isActiveUser(userId)) return;

                const current = store.userWorkout();
                if (current?.userId === userId) {
                    queueSaveUserWorkout({
                        userId,
                        favoriteWorkouts: current.favoriteWorkouts ?? [],
                        workoutItems: [...(current.workoutItems ?? []), item]
                    });
                    return;
                }

                pendingSessionAppends = [...pendingSessionAppends, { userId, item }];
                syncPendingSessionAppendCount();
                if (!hasPendingSaveForUser(userId)) {
                    getOrCreateTrigger.next({ userId, revision: userWorkoutRevision });
                }
            }
        };
    })
);
