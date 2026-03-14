import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { userWorkoutsInitialState, type UserWorkoutsState } from './user-workouts.model';
import { UserWorkoutsService } from './user-workouts.service';
import type { UserWorkout } from './user-workouts.model';

export const UserWorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<UserWorkoutsState>(userWorkoutsInitialState),
    withComputed(({ userWorkout }) => ({
        hasUserWorkout: computed(() => userWorkout() !== null)
    })),
    withMethods((store, userWorkoutsService = inject(UserWorkoutsService)) => {
        const loadTrigger = new Subject<string>();
        const saveTrigger = new Subject<UserWorkout>();
        const getOrCreateTrigger = new Subject<string>();

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

        rxMethod<UserWorkout>((payload$) =>
            payload$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((payload) =>
                    userWorkoutsService.saveUserWorkout(payload).pipe(
                        tapResponse({
                            next: (saved) => patchState(store, { userWorkout: saved, isLoading: false }),
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
            saveUserWorkout: (userWorkout: UserWorkout) => saveTrigger.next(userWorkout),
            getOrCreateUserWorkout: (userId: string) => getOrCreateTrigger.next(userId)
        };
    })
);
