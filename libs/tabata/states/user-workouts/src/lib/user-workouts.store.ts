import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap, switchMap, concatMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { userWorkoutsInitialState, type UserWorkoutsState } from './user-workouts.model';
import { UserWorkoutsService } from './user-workouts.service';
import type { UserWorkout } from './user-workouts.model';

type SaveRequest = {
    requestId: number;
    userWorkout: UserWorkout;
};

export const UserWorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<UserWorkoutsState>(userWorkoutsInitialState),
    withComputed(({ userWorkout }) => ({
        hasUserWorkout: computed(() => userWorkout() !== null)
    })),
    withMethods((store, userWorkoutsService = inject(UserWorkoutsService)) => {
        const loadTrigger = new Subject<string>();
        const saveTrigger = new Subject<SaveRequest>();
        const getOrCreateTrigger = new Subject<string>();
        let latestSaveRequestId = 0;

        rxMethod<string>((userId$) =>
            userId$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((userId) =>
                    userWorkoutsService.getUserWorkout(userId).pipe(
                        tapResponse({
                            next: (userWorkout) => patchState(store, { userWorkout: userWorkout ?? null, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                isLoading: false
                            });
                            return of(null);
                        })
                    )
                )
            )
        )(loadTrigger);

        rxMethod<SaveRequest>((payload$) =>
            payload$.pipe(
                concatMap(({ requestId, userWorkout }) => {
                    return userWorkoutsService.saveUserWorkout(userWorkout).pipe(
                        tapResponse({
                            next: (saved) => {
                                if (requestId === latestSaveRequestId) {
                                    patchState(store, { userWorkout: saved, isLoading: false });
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
                        })
                    );
                })
            )
        )(saveTrigger);

        rxMethod<string>((userId$) =>
            userId$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((userId) =>
                    userWorkoutsService.getOrCreateUserWorkout(userId).pipe(
                        tapResponse({
                            next: (userWorkout) => patchState(store, { userWorkout, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                isLoading: false
                            });
                            return of(null as unknown as UserWorkout);
                        })
                    )
                )
            )
        )(getOrCreateTrigger);

        return {
            loadUserWorkout: (userId: string) => loadTrigger.next(userId),
            saveUserWorkout: (userWorkout: UserWorkout) => {
                latestSaveRequestId += 1;
                patchState(store, { userWorkout, isLoading: true, error: null });
                saveTrigger.next({ requestId: latestSaveRequestId, userWorkout });
            },
            getOrCreateUserWorkout: (userId: string) => getOrCreateTrigger.next(userId)
        };
    })
);
