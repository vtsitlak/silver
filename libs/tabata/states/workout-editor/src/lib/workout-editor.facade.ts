import { inject, Injectable } from '@angular/core';
import { WorkoutEditorStore } from './workout-editor.store';
import type { WorkoutDraft } from './workout-editor.models';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorFacade {
    private readonly store = inject(WorkoutEditorStore);

    readonly initialDraftSnapshot = this.store.initialDraftSnapshot;
    readonly workoutDraft = this.store.workoutDraft;
    readonly isEditMode = this.store.isEditMode;
    readonly canSubmitWorkout = this.store.canSubmitWorkout;
    readonly hasDraftChanges = this.store.hasDraftChanges;
    readonly hasUnsavedChanges = this.store.hasUnsavedChanges;
    readonly mergedWorkout = this.store.mergedWorkout;

    /** Applies a loaded workout to draft + baseline snapshot (e.g. after GET by id). */
    hydrateEditorFromWorkout(workout: TabataWorkout): void {
        this.store.hydrateEditorFromWorkout(workout);
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
