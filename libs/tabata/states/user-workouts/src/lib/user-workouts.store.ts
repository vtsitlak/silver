import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap, switchMap, concatMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { userWorkoutsInitialState, type UserWorkoutsState } from './user-workouts.model';
import { UserWorkoutsService } from './user-workouts.service';
import type { UserWorkout } from './user-workouts.model';

interface SaveUserWorkoutRequest {
    requestId: number;
    userWorkout: UserWorkout;
}

interface UserWorkoutLoadRequest {
    userId: string;
    revision: number;
}

export const UserWorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<UserWorkoutsState>(userWorkoutsInitialState),
    withComputed(({ userWorkout }) => ({
        hasUserWorkout: computed(() => userWorkout() !== null)
    })),
    withMethods((store, userWorkoutsService = inject(UserWorkoutsService)) => {
        const loadTrigger = new Subject<UserWorkoutLoadRequest>();
        const saveTrigger = new Subject<SaveUserWorkoutRequest>();
        const getOrCreateTrigger = new Subject<UserWorkoutLoadRequest>();
        let latestSaveRequestId = 0;
        let userWorkoutRevision = 0;
        const latestPendingSaveByUserId = new Map<string, number>();

        const hasPendingSaveForUser = (userId: string): boolean => latestPendingSaveByUserId.has(userId);

        const applyLoadedUserWorkout = ({ userId, revision }: UserWorkoutLoadRequest, userWorkout: UserWorkout | null): void => {
            if (revision !== userWorkoutRevision || hasPendingSaveForUser(userId)) {
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
                                if (requestId === latestSaveRequestId) {
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
                    return userWorkoutsService.getOrCreateUserWorkout(userId).pipe(
                        tapResponse({
                            next: (userWorkout) => applyLoadedUserWorkout(request, userWorkout),
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
                if (hasPendingSaveForUser(userId)) return;
                loadTrigger.next({ userId, revision: userWorkoutRevision });
            },
            saveUserWorkout: (userWorkout: UserWorkout) => {
                const requestId = latestSaveRequestId + 1;
                latestSaveRequestId = requestId;
                userWorkoutRevision += 1;
                latestPendingSaveByUserId.set(userWorkout.userId, requestId);
                patchState(store, { userWorkout, isLoading: true, error: null });
                saveTrigger.next({ requestId, userWorkout });
            },
            getOrCreateUserWorkout: (userId: string) => {
                if (hasPendingSaveForUser(userId)) return;
                getOrCreateTrigger.next({ userId, revision: userWorkoutRevision });
            }
        };
    })
);
