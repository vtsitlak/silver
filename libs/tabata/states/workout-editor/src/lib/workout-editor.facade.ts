import { inject, Injectable } from '@angular/core';
import { WorkoutEditorStore } from './workout-editor.store';
import type { CreateWorkoutPayload, UpdateWorkoutPayload } from './workout-editor.models';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorFacade {
    private readonly store = inject(WorkoutEditorStore);

    readonly workout = this.store.workout;
    readonly isLoading = this.store.isLoading;
    readonly isSaving = this.store.isSaving;
    readonly error = this.store.error;
    readonly isEditMode = this.store.isEditMode;
    readonly isBusy = this.store.isBusy;

    loadWorkout(id: string): void {
        this.store.loadWorkout(id);
    }

    createWorkout(payload: CreateWorkoutPayload): void {
        this.store.createWorkout(payload);
    }

    updateWorkout(id: string, payload: UpdateWorkoutPayload): void {
        this.store.updateWorkout(id, payload);
    }

    deleteWorkout(id: string): void {
        this.store.deleteWorkout(id);
    }

    reset(): void {
        this.store.reset();
    }
}
