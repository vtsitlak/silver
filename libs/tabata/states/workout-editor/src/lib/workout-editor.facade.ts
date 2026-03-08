import { inject, Injectable } from '@angular/core';
import { WorkoutEditorStore } from './workout-editor.store';
import type { CreateWorkoutPayload, UpdateWorkoutPayload, WorkoutDraft } from './workout-editor.models';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorFacade {
    private readonly store = inject(WorkoutEditorStore);

    readonly workout = this.store.workout;
    readonly workoutDraft = this.store.workoutDraft;
    readonly isLoading = this.store.isLoading;
    readonly isSaving = this.store.isSaving;
    readonly error = this.store.error;
    readonly isEditMode = this.store.isEditMode;
    readonly isBusy = this.store.isBusy;
    readonly hasDraftChanges = this.store.hasDraftChanges;
    readonly mergedWorkout = this.store.mergedWorkout;

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

    updateDraft(changes: WorkoutDraft): void {
        this.store.updateDraft(changes);
    }

    setDraft(draft: WorkoutDraft): void {
        this.store.setDraft(draft);
    }

    clearDraft(): void {
        this.store.clearDraft();
    }

    initDraftFromWorkout(): void {
        this.store.initDraftFromWorkout();
    }

    reset(): void {
        this.store.reset();
    }
}
