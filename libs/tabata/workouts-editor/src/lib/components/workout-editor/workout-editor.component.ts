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
import { WorkoutEditorFacade, type WorkoutDraft } from '@silver/tabata/states/workout-editor';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { Phase, TabataBlock, WorkoutInfoFormModel, WorkoutsFacade } from '@silver/tabata/states/workouts';
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
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly workoutSubmitService = inject(WorkoutSubmitService);

    readonly selectedTab = signal<WorkoutEditorTab>('info');
    /**
     * Bound from route params via `withComponentInputBinding()`.
     * - `workout-editor/create` => null
     * - `workout-editor/:workoutId` => string
     */
    readonly workoutId = input<string | null>(null);
    readonly isEditMode = this.facade.isEditMode;
    readonly isSaving = this.workoutsFacade.isSaving;

    /**
     * Loaded workout from the editor store (set by `loadWorkout`, not merged with draft).
     * Children hydrate local UI from this and emit `draftChange`; this shell updates the draft via the facade.
     */
    readonly workout = this.facade.workout;

    readonly pageTitle = computed(() => (this.workoutId() ? 'Edit Workout' : 'Create Workout'));
    readonly loadedInfo = computed<WorkoutInfoFormModel | null>(() => {
        const w = this.workout();
        if (!w) return null;
        const { name, description, generatedByAi, mainTargetBodypart, availableEquipments, secondaryTargetBodyparts } = w;
        return { name, description, generatedByAi, mainTargetBodypart, availableEquipments, secondaryTargetBodyparts };
    });
    readonly loadedMainBlocks = computed<TabataBlock[]>(() => {
        const w = this.workout();
        if (!w) return [];
        return w.blocks ?? [];
    });
    readonly loadedCooldownPhase = computed<Phase | null>(() => {
        const w = this.workout();
        if (!w) return null;
        return w.cooldown;
    });
    readonly loadedWarmupPhase = computed<Phase | null>(() => {
        const w = this.workout();
        if (!w) return null;
        return w.warmup ?? null;
    });

    constructor() {
        // Ionic may cache this component between navigations, so we don't rely solely on
        // `workoutId()` changes to reset state. See `ionViewWillEnter()`.
    }

    /**
     * Called every time the view is about to enter and become active.
     * This fixes cases where Ionic keeps the component instance cached.
     */
    ionViewWillEnter(): void {
        const id = this.workoutId();
        this.selectedTab.set('info');
        this.facade.reset();
        if (id) this.facade.loadWorkout(id);
    }

    onTabChange(value: string): void {
        this.selectedTab.set(value as WorkoutEditorTab);
    }

    onDraftChange(changes: Partial<WorkoutDraft>): void {
        this.facade.updateDraft(changes);
    }

    onClearDraftRequested(): void {
        this.facade.clearDraft();
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
        return this.facade.isSaveEnabled(this.workoutsFacade.isSaving());
    }
}
