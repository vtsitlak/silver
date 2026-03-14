import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { Exercise } from './exercise.model';
import { ExercisesService } from './exercises.service';
import type { SortBy, SortOrder } from './exercise.model';

export interface ExerciseState {
    exercises: Exercise[];
    selectedExercise: Exercise | null;
    isLoading: boolean;
    error: string | null;
    musclesList: string[];
    equipmentList: string[];
    categoryList: string[];
    /** Map of exerciseId -> Exercise for the current context (e.g. workout details). */
    exercisesMap: Record<string, Exercise>;
}

export const exerciseInitialState: ExerciseState = {
    exercises: [],
    selectedExercise: null,
    isLoading: false,
    error: null,
    musclesList: [],
    equipmentList: [],
    categoryList: [],
    exercisesMap: {}
};

export const ExercisesStore = signalStore(
    { providedIn: 'root' },

    withState<ExerciseState>(exerciseInitialState),

    withComputed(({ exercises, selectedExercise }) => ({
        hasExercises: computed(() => exercises().length > 0),
        hasSelectedExercise: computed(() => !!selectedExercise())
    })),

    withMethods((store, exercisesService = inject(ExercisesService)) => {
        const getAllTrigger = new Subject<{ limit?: number; offset?: number } | void>();
        const getMusclesListTrigger = new Subject<void>();
        const getEquipmentListTrigger = new Subject<void>();
        const getCategoryListTrigger = new Subject<void>();

        rxMethod<{ limit?: number; offset?: number } | void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((params) => {
                    const { limit = 10, offset = 0 } = params ?? {};
                    return exercisesService.getAllExercises(limit, offset).pipe(
                        tapResponse({
                            next: (exercises) => {
                                const current = store.exercises();
                                const nextExercises = offset > 0 ? [...current, ...exercises] : exercises;
                                patchState(store, { exercises: nextExercises, isLoading: false });
                            },
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                            return of([]);
                        })
                    );
                })
            )
        )(getAllTrigger);

        rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap(() =>
                    exercisesService.getMusclesList().pipe(
                        tapResponse({
                            next: (musclesList) => patchState(store, { musclesList, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                            return of([]);
                        })
                    )
                )
            )
        )(getMusclesListTrigger);

        rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap(() =>
                    exercisesService.getEquipmentList().pipe(
                        tapResponse({
                            next: (equipmentList) => patchState(store, { equipmentList, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                            return of([]);
                        })
                    )
                )
            )
        )(getEquipmentListTrigger);

        rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap(() =>
                    exercisesService.getCategoryList().pipe(
                        tapResponse({
                            next: (categoryList) => patchState(store, { categoryList, isLoading: false }),
                            error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                            return of([]);
                        })
                    )
                )
            )
        )(getCategoryListTrigger);

        return {
            getAllExercises: (params?: { limit?: number; offset?: number }) => {
                const { limit = 10, offset = 0 } = params ?? {};
                if (offset === 0 && store.exercises().length > 0) return;
                getAllTrigger.next(params);
            },
            getMusclesList: () => {
                if (store.musclesList().length > 0) return;
                getMusclesListTrigger.next();
            },
            getEquipmentList: () => {
                if (store.equipmentList().length > 0) return;
                getEquipmentListTrigger.next();
            },
            getCategoryList: () => {
                if (store.categoryList().length > 0) return;
                getCategoryListTrigger.next();
            },

            getExerciseById: rxMethod<string>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((id) =>
                        exercisesService.getExerciseById(id).pipe(
                            tapResponse({
                                next: (exercise) => patchState(store, { selectedExercise: exercise ?? null, isLoading: false }),
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of(null);
                            })
                        )
                    )
                )
            ),

            searchExercises: rxMethod<{ q: string; limit?: number; offset?: number; threshold?: number }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ q, limit = 10, offset = 0, threshold }) =>
                        exercisesService.searchExercises(q, limit, offset, threshold).pipe(
                            tapResponse({
                                next: (exercises) => patchState(store, { exercises, isLoading: false }),
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of([]);
                            })
                        )
                    )
                )
            ),

            filterExercises: rxMethod<{
                offset?: number;
                limit?: number;
                search?: string;
                muscles?: string;
                equipment?: string;
                category?: string;
                sortBy?: SortBy;
                sortOrder?: SortOrder;
            }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((options) =>
                        exercisesService.filterExercises(options).pipe(
                            tapResponse({
                                next: (exercises) => {
                                    const current = store.exercises();
                                    const offset = options.offset ?? 0;
                                    const nextExercises = offset > 0 ? [...current, ...exercises] : exercises;
                                    patchState(store, { exercises: nextExercises, isLoading: false });
                                },
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of([]);
                            })
                        )
                    )
                )
            ),

            getExercisesByCategory: rxMethod<{ categoryName: string; limit?: number; offset?: number }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ categoryName, limit = 10, offset = 0 }) =>
                        exercisesService.getExercisesByCategory(categoryName, limit, offset).pipe(
                            tapResponse({
                                next: (exercises) => patchState(store, { exercises, isLoading: false }),
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of([]);
                            })
                        )
                    )
                )
            ),

            getExercisesByEquipment: rxMethod<{ equipmentName: string; limit?: number; offset?: number }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ equipmentName, limit = 10, offset = 0 }) =>
                        exercisesService.getExercisesByEquipment(equipmentName, limit, offset).pipe(
                            tapResponse({
                                next: (exercises) => patchState(store, { exercises, isLoading: false }),
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of([]);
                            })
                        )
                    )
                )
            ),

            getExercisesByMuscle: rxMethod<{
                muscleName: string;
                limit?: number;
                offset?: number;
                includeSecondary?: boolean;
            }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ muscleName, limit = 10, offset = 0, includeSecondary = false }) =>
                        exercisesService.getExercisesByMuscle(muscleName, limit, offset, includeSecondary).pipe(
                            tapResponse({
                                next: (exercises) => patchState(store, { exercises, isLoading: false }),
                                error: (err: Error) => patchState(store, { error: err.message, isLoading: false })
                            }),
                            catchError((err: unknown) => {
                                patchState(store, { error: err instanceof Error ? err.message : String(err), isLoading: false });
                                return of([]);
                            })
                        )
                    )
                )
            ),

            clearSelectedExercise: () => patchState(store, { selectedExercise: null }),
            clearError: () => patchState(store, { error: null }),

            loadExercisesMap: (ids: string[]) => {
                exercisesService
                    .getExercisesMap(ids)
                    .pipe(
                        take(1),
                        tapResponse({
                            next: (exercisesMap) => patchState(store, { exercisesMap }),
                            error: (err: Error) => patchState(store, { error: err.message })
                        }),
                        catchError((err: unknown) => {
                            patchState(store, { error: err instanceof Error ? err.message : String(err) });
                            return of({});
                        })
                    )
                    .subscribe();
            }
        };
    })
);
