import { computed, inject, Injectable } from '@angular/core';
import type { SortBy, SortOrder } from './exercise.model';
import { ExercisesStore } from './exercises.store';

@Injectable({ providedIn: 'root' })
export class ExercisesFacade {
    private readonly store = inject(ExercisesStore);

    readonly exercises = this.store.exercises;
    readonly selectedExercise = this.store.selectedExercise;
    readonly isLoading = this.store.isLoading;
    readonly error = this.store.error;
    readonly musclesList = this.store.musclesList;
    readonly equipmentList = this.store.equipmentList;
    readonly bodyPartList = this.store.bodyPartList;

    readonly hasExercises = this.store.hasExercises;
    readonly hasSelectedExercise = this.store.hasSelectedExercise;
    readonly hasError = computed(() => !!this.store.error());

    getAllExercises(params?: { limit?: number; offset?: number }): void {
        this.store.getAllExercises(params);
    }

    getExerciseById(exerciseId: string): void {
        this.store.getExerciseById(exerciseId);
    }

    searchExercises(q: string, limit?: number, offset?: number, threshold?: number): void {
        this.store.searchExercises({ q, limit, offset, threshold });
    }

    filterExercises(options: {
        offset?: number;
        limit?: number;
        search?: string;
        muscles?: string;
        equipment?: string;
        bodyParts?: string;
        sortBy?: SortBy;
        sortOrder?: SortOrder;
    }): void {
        this.store.filterExercises(options);
    }

    getExercisesByBodyPart(bodyPartName: string, limit?: number, offset?: number): void {
        this.store.getExercisesByBodyPart({ bodyPartName, limit, offset });
    }

    getExercisesByEquipment(equipmentName: string, limit?: number, offset?: number): void {
        this.store.getExercisesByEquipment({ equipmentName, limit, offset });
    }

    getExercisesByMuscle(muscleName: string, limit?: number, offset?: number, includeSecondary?: boolean): void {
        this.store.getExercisesByMuscle({ muscleName, limit, offset, includeSecondary });
    }

    getMusclesList(): void {
        this.store.getMusclesList();
    }

    getEquipmentList(): void {
        this.store.getEquipmentList();
    }

    getBodyPartList(): void {
        this.store.getBodyPartList();
    }

    clearSelectedExercise(): void {
        this.store.clearSelectedExercise();
    }

    clearError(): void {
        this.store.clearError();
    }
}
