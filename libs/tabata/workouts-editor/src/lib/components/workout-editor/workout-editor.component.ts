import { ChangeDetectionStrategy, Component, computed, input, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader,
    IonContent,
    IonFooter,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner
} from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { EMPTY_PHASE, toWorkoutInfoFormModelFromSnapshot, WorkoutEditorFacade, type WorkoutDraft } from '@silver/tabata/states/workout-editor';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { WorkoutEditorInitService } from '../../services/workout-editor-init.service';
import { Phase, TabataBlock, WorkoutsFacade } from '@silver/tabata/states/workouts';
import { WorkoutInfoComponent } from '../workout-info/workout-info.component';
import { WorkoutPhaseComponent } from '../workout-phase/workout-phase.component';
import { MainWorkoutComponent } from '../main-workout/main-workout.component';
export type WorkoutEditorTab = 'info' | 'warmup' | 'main' | 'cooldown';

@Component({
    selector: 'tbt-workout-editor',
    templateUrl: 'workout-editor.component.html',
    styleUrls: ['workout-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        IonHeader,
        IonContent,
        IonFooter,
        IonButton,
        IonButtons,
        IonBackButton,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonSpinner,
        ToolbarComponent,
        WorkoutInfoComponent,
        WorkoutPhaseComponent,
        MainWorkoutComponent
    ]
})
export class WorkoutEditorComponent {
    private readonly router = inject(Router);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly workoutEditorInit = inject(WorkoutEditorInitService);
    private readonly workoutSubmitService = inject(WorkoutSubmitService);

    readonly selectedTab = signal<WorkoutEditorTab>('info');
    /**
     * Bound from route params via `withComponentInputBinding()`.
     * - `workout-editor/create` => null
     * - `workout-editor/:workoutId` => string
     */
    readonly workoutId = input<string | null>(null);
    readonly isEditMode = this.workoutEditorFacade.isEditMode;
    readonly isSaving = this.workoutsFacade.isSaving;

    /** Baseline snapshot after load; children read derived props and emit `draftChange`. */
    readonly initialDraftSnapshot = this.workoutEditorFacade.initialDraftSnapshot;

    readonly pageTitle = computed(() => (this.workoutId() ? 'Edit Workout' : 'Create Workout'));

    /**
     * From `initialDraftSnapshot` only (not `workoutDraft()`), or `draftChange` would invalidate this computed
     * and cause an NG0103 loop with `WorkoutInfoComponent`.
     * `reset()` clones baseline in the store so this computed re-runs after each `ionViewWillEnter`.
     */
    readonly loadedInfo = computed(() => toWorkoutInfoFormModelFromSnapshot(this.initialDraftSnapshot()));
    readonly loadedMainBlocks = computed<TabataBlock[]>(() => {
        const w = this.initialDraftSnapshot();
        return w?.blocks ?? [];
    });
    readonly loadedCooldownPhase = computed<Phase>(() => {
        const w = this.initialDraftSnapshot();
        return w?.cooldown ?? EMPTY_PHASE;
    });
    readonly loadedWarmupPhase = computed<Phase>(() => {
        const w = this.initialDraftSnapshot();
        return w?.warmup ?? EMPTY_PHASE;
    });

    /**
     * Called every time the view is about to enter and become active.
     * This fixes cases where Ionic keeps the component instance cached.
     */
    ionViewWillEnter(): void {
        this.selectedTab.set('info');
        this.workoutEditorFacade.reset();
        const id = this.workoutId();
        if (id) {
            this.workoutEditorInit.loadWorkoutForEditor(id);
        }
    }

    onTabChange(value: string): void {
        this.selectedTab.set(value as WorkoutEditorTab);
    }

    onDraftChange(changes: Partial<WorkoutDraft>): void {
        this.workoutEditorFacade.updateDraft(changes);
    }

    onClearDraftRequested(): void {
        this.workoutEditorFacade.clearDraft();
    }

    onCancel(): void {
        void this.router.navigate(['/tabs/workouts']);
    }

    onSave(): void {
        this.workoutSubmitService.submitWorkout({
            navigateToWorkouts: true
        });
    }

    isSaveEnabled(): boolean {
        return this.workoutEditorFacade.isSaveEnabled(this.workoutsFacade.isSaving());
    }
}
