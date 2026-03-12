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
        const loadTrigger = new Subject<void>();
        rxMethod<void>((trigger$) =>
            trigger$.pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap(() =>
                    workoutsService.getWorkouts().pipe(
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
        return {
            loadWorkouts: () => loadTrigger.next(),
            removeWorkout: (id: string) => {
                patchState(store, { workouts: store.workouts().filter((w) => w.id !== id), error: null });
                return workoutsService.deleteWorkout(id).pipe(
                    tap(() => {}),
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
