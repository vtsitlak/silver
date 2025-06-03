import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ExercisesService, Exercise } from '../services/exercises.service';

export interface ExerciseState {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
  targetList: string[];
  equipmentList: string[];
  bodyPartList: string[];
}

export const exerciseInitialState: ExerciseState = {
  exercises: [],
  selectedExercise: null,
  isLoading: false,
  error: null,
  targetList: [],
  equipmentList: [],
  bodyPartList: [],
};

export const ExercisesStore = signalStore(
  { providedIn: 'root' },

  // --- STATE ---
  withState<ExerciseState>(exerciseInitialState),

  // --- COMPUTED ---
  withComputed(({ exercises, selectedExercise }) => ({
    hasExercises: computed(() => exercises().length > 0),
    hasSelectedExercise: computed(() => !!selectedExercise()),
  })),

  // --- METHODS ---
  withMethods((store, exercisesService = inject(ExercisesService)) => ({
    getAllExercises: rxMethod<{ limit?: number; offset?: number } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const { limit = 10, offset = 0 } = params || {};
          return exercisesService.getAllExercises(limit, offset).pipe(
            tapResponse({
              next: (exercises) => {
                patchState(store, { exercises, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          );
        })
      )
    ),

    getExerciseById: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          exercisesService.getExerciseById(id).pipe(
            tapResponse({
              next: (exercise) => {
                patchState(store, { selectedExercise: exercise, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of(null);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),

    getExercisesByName: rxMethod<{ name: string; limit?: number; offset?: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ name, limit = 10, offset = 0 }) =>
          exercisesService.getExercisesByName(name, limit, offset).pipe(
            tapResponse({
              next: (exercises) => {
                patchState(store, { exercises, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getExercisesByTarget: rxMethod<{ target: string; limit?: number; offset?: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ target, limit = 10, offset = 0 }) =>
          exercisesService.getExercisesByTarget(target, limit, offset).pipe(
            tapResponse({
              next: (exercises) => {
                patchState(store, { exercises, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getExercisesByEquipment: rxMethod<{ equipment: string; limit?: number; offset?: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ equipment, limit = 10, offset = 0 }) =>
          exercisesService.getExercisesByEquipment(equipment, limit, offset).pipe(
            tapResponse({
              next: (exercises) => {
                patchState(store, { exercises, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getExercisesByBodyPart: rxMethod<{ bodyPart: string; limit?: number; offset?: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ bodyPart, limit = 10, offset = 0 }) =>
          exercisesService.getExercisesByBodyPart(bodyPart, limit, offset).pipe(
            tapResponse({
              next: (exercises) => {
                patchState(store, { exercises, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getTargetList: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          exercisesService.getTargetList().pipe(
            tapResponse({
              next: (targetList) => {
                patchState(store, { targetList, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getEquipmentList: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          exercisesService.getEquipmentList().pipe(
            tapResponse({
              next: (equipmentList) => {
                patchState(store, { equipmentList, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    getBodyPartList: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          exercisesService.getBodyPartList().pipe(
            tapResponse({
              next: (bodyPartList) => {
                patchState(store, { bodyPartList, isLoading: false });
              },
              error: (error: Error) => {
                patchState(store, { error: error.message, isLoading: false });
                return of([]);
              },
            }),
            catchError((error: any) => {
              patchState(store, { error: error.message, isLoading: false });
              return of([]);
            })
          )
        )
      )
    ),

    clearSelectedExercise: () => {
      patchState(store, { selectedExercise: null });
    },
    clearError: () => {
      patchState(store, { error: null });
    },
  }))
);
