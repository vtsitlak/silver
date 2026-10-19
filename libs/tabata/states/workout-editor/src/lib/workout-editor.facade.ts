import { inject, Injectable } from '@angular/core';
import type { Subscription } from 'rxjs';
import { WorkoutEditorStore } from './workout-editor.store';
import type { AiGeneratedWorkoutStructure, WorkoutDraft } from './workout-editor.models';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorFacade {
    private readonly store = inject(WorkoutEditorStore);
    /** In-flight Generate-with-AI subscription. Cleared on reset/clearDraft so a late response cannot overwrite another session. */
    private inFlightAiGeneration: Subscription | null = null;

    readonly initialDraftSnapshot = this.store.initialDraftSnapshot;
    readonly workoutDraft = this.store.workoutDraft;
    readonly isEditMode = this.store.isEditMode;
    readonly canSubmitWorkout = this.store.canSubmitWorkout;
    readonly hasDraftChanges = this.store.hasDraftChanges;
    readonly hasUnsavedChanges = this.store.hasUnsavedChanges;
    readonly mergedWorkout = this.store.mergedWorkout;
    readonly aiStructureLock = this.store.aiStructureLock;

    /** Applies a loaded workout to draft + baseline snapshot (e.g. after GET by id). */
    hydrateEditorFromWorkout(workout: TabataWorkout): void {
        this.store.hydrateEditorFromWorkout(workout);
    }

    /**
     * Applies AI-generated structure and pins it so mounted editor tabs cannot overwrite
     * warmup/blocks/cooldown while the preview modal is open.
     */
    lockAiGeneratedStructure(structure: AiGeneratedWorkoutStructure): void {
        this.store.lockAiGeneratedStructure(structure);
    }

    clearAiStructureLock(): void {
        this.store.clearAiStructureLock();
    }

    updateDraft(changes: WorkoutDraft): void {
        this.store.updateDraft(changes);
    }

    setDraft(draft: WorkoutDraft): void {
        this.store.setDraft(draft);
    }

    /**
     * Tracks the active Generate-with-AI subscription, replacing any previous one.
     * {@link reset} and {@link clearDraft} unsubscribe it. The editor calls those when leaving
     * or re-entering, so a response that arrives after the user opened another workout is dropped.
     */
    trackAiGeneration(subscription: Subscription): void {
        if (this.inFlightAiGeneration && this.inFlightAiGeneration !== subscription) {
            this.inFlightAiGeneration.unsubscribe();
        }
        this.inFlightAiGeneration = subscription;
    }

    clearDraft(): void {
        this.cancelAiGeneration();
        this.store.clearDraft();
    }

    reset(): void {
        this.cancelAiGeneration();
        this.store.reset();
    }

    private cancelAiGeneration(): void {
        this.inFlightAiGeneration?.unsubscribe();
        this.inFlightAiGeneration = null;
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
