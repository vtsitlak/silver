import { inject, Injectable } from '@angular/core';
import { WorkoutEditorStore } from './workout-editor.store';
import type { WorkoutDraft } from './workout-editor.models';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorFacade {
    private readonly store = inject(WorkoutEditorStore);

    readonly workout = this.store.workout;
    readonly workoutDraft = this.store.workoutDraft;
    readonly isLoading = this.store.isLoading;
    readonly error = this.store.error;
    readonly isEditMode = this.store.isEditMode;
    readonly isBusy = this.store.isBusy;
    readonly canSubmitWorkout = this.store.canSubmitWorkout;
    readonly hasDraftChanges = this.store.hasDraftChanges;
    readonly hasUnsavedChanges = this.store.hasUnsavedChanges;
    readonly mergedWorkout = this.store.mergedWorkout;

    loadWorkout(id: string): void {
        this.store.loadWorkout(id);
    }

    /** Set current workout from list/cache (no API call). Use when opening edit from workouts list. */
    setWorkout(workout: TabataWorkout | null): void {
        this.store.setWorkout(workout);
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

    /**
     * Centralized save enable/disable logic.
     * @param isSaving external saving state (e.g. workouts facade)
     */
    isSaveEnabled(isSaving: boolean): boolean {
        if (isSaving) return false;
        if (!this.canSubmitWorkout()) return false;
        if (this.isEditMode()) return this.hasUnsavedChanges();
        return true;
    }
}
