import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { workoutsInitialState, type WorkoutsState } from './workouts.models';
import { WorkoutsService } from './workouts.service';

export const WorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutsState>(workoutsInitialState),
    withComputed(({ workouts }) => ({
        hasWorkouts: computed(() => workouts().length > 0)
    })),
    withMethods((store, workoutsService = inject(WorkoutsService)) => {
        const loadTrigger = new Subject<string | void>();
        const loadWorkoutByIdTrigger = new Subject<string>();

        rxMethod<string | void>((trigger$) =>
            trigger$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null, loadedWorkout: null })),
                switchMap((search) =>
                    workoutsService.getWorkouts(search === undefined || search === null ? undefined : search).pipe(
                        tapResponse({
                            next: (workouts) => patchState(store, { workouts, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                isLoading: false
                            });
                            return of([]);
                        })
                    )
                )
            )
        )(loadTrigger);

        rxMethod<string>((id$) =>
            id$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((id) =>
                    workoutsService.getWorkoutById(id).pipe(
                        tapResponse({
                            next: (workout) => {
                                if (workout) {
                                    const current = store.workouts();
                                    const exists = current.some((w) => w.id === workout.id);
                                    const next = exists ? current.map((w) => (w.id === workout.id ? workout : w)) : [...current, workout];
                                    patchState(store, { workouts: next, loadedWorkout: workout, isLoading: false });
                                } else {
                                    patchState(store, { loadedWorkout: null, isLoading: false });
                                }
                            },
                            error: (err: Error) => patchState(store, { error: err.message, loadedWorkout: null, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, {
                                error: err instanceof Error ? err.message : String(err),
                                loadedWorkout: null,
                                isLoading: false
                            });
                            return of(null);
                        })
                    )
                )
            )
        )(loadWorkoutByIdTrigger);

        return {
            loadWorkouts: (search?: string) => loadTrigger.next(search),
            loadWorkoutById: (id: string) => loadWorkoutByIdTrigger.next(id),
            removeWorkout: (id: string) => {
                patchState(store, { workouts: store.workouts().filter((w) => w.id !== id), error: null });
                return workoutsService.deleteWorkout(id).pipe(
                    tap(() => undefined),
                    catchError((err: unknown) => {
                        patchState(store, {
                            error: err instanceof Error ? err.message : String(err)
                        });
                        return of({ success: false });
                    })
                );
            }
        };
    })
);
