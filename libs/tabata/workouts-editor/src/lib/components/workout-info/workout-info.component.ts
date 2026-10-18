import { Component, computed, effect, inject, input, output, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ActionSheetController, IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonSpinner, IonTextarea } from '@ionic/angular/standalone';
import {
    BODYWEIGHT_CATEGORY,
    createEmptyWorkoutInfoFormModel,
    ensureBodyweightIncluded,
    mapLoadedWorkoutInfoToFormModel,
    type WorkoutDraft
} from '@silver/tabata/states/workout-editor';
import {
    EQUIPMENT_CATEGORY_OPTIONS,
    BODY_REGION_OPTIONS,
    WORKOUT_LEVEL_OPTIONS,
    WORKOUT_PRIMARY_GOAL_OPTIONS,
    type BodyRegion,
    type WorkoutLevel,
    type WorkoutPrimaryGoal
} from '@silver/tabata/helpers';
import { AiWorkoutGenerationService } from '../../services/ai-workout-generation.service';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { finalize } from 'rxjs/operators';
import type { WorkoutInfoFormModel } from '@silver/tabata/states/workouts';

@Component({
    selector: 'tbt-workout-info',
    templateUrl: 'workout-info.component.html',
    styleUrls: ['workout-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonSpinner, IonTextarea, FormField]
})
export class WorkoutInfoComponent {
    private readonly aiWorkoutGeneration = inject(AiWorkoutGenerationService);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly actionSheetCtrl = inject(ActionSheetController);

    /** Snapshot from the editor's loaded workout (not live draft) — avoids parent↔draft feedback loops. */
    readonly loadedInfo = input<WorkoutInfoFormModel | null>(null);

    /** When `false` (edit existing workout), AI generation UI is hidden. */
    readonly isCreateMode = input(true);

    readonly draftChange = output<Partial<WorkoutDraft>>();
    /** Emitted when the parent should discard the current draft (e.g. leave create flow). */
    readonly clearDraftRequested = output<void>();

    readonly equipmentOptions = [BODYWEIGHT_CATEGORY, ...EQUIPMENT_CATEGORY_OPTIONS.filter((eq) => eq !== BODYWEIGHT_CATEGORY)];
    readonly bodyRegionOptions = BODY_REGION_OPTIONS;
    readonly workoutLevelOptions = WORKOUT_LEVEL_OPTIONS;
    readonly workoutPrimaryGoalOptions = WORKOUT_PRIMARY_GOAL_OPTIONS;
    readonly workoutLevelLabel: Record<WorkoutLevel, string> = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        expert: 'Expert'
    };
    readonly workoutPrimaryGoalLabel: Record<WorkoutPrimaryGoal, string> = {
        Cardio: 'Cardio',
        Strength: 'Strength',
        Explosion: 'Explosion'
    };

    readonly mainTargetDisabled = computed(() => (region: BodyRegion) => this.formModel().secondaryTargetBodyparts.includes(region));
    readonly secondaryTargetDisabled = computed(() => (region: BodyRegion) => this.formModel().mainTargetBodypart === region);

    readonly formModel = signal<WorkoutInfoFormModel>(createEmptyWorkoutInfoFormModel());

    infoForm = form(this.formModel, (schemaPath) => {
        required(schemaPath.name, { message: 'Name is required' });
        required(schemaPath.description, { message: 'Description is required' });
        required(schemaPath.mainTargetBodypart, { message: 'Main target is required' });
        required(schemaPath.level, { message: 'Level is required' });
        required(schemaPath.primaryGoal, { message: 'Primary goal is required' });
    });

    readonly isFormValid = computed(() => this.infoForm().valid());
    readonly isGenerating = signal(false);

    constructor() {
        // `loadedInfo` is derived from `workout()` in the parent; it only changes when that workout changes, not on draft patches.
        effect(() => {
            const loaded = this.loadedInfo();
            untracked(() => {
                if (!loaded) {
                    this.formModel.set(createEmptyWorkoutInfoFormModel());
                } else {
                    this.formModel.set(mapLoadedWorkoutInfoToFormModel(loaded));
                }
                /** Re-hydrating from the editor snapshot must clear interaction state (e.g. after Save → Add workout). */
                this.infoForm().reset();
            });
        });

        effect(() => {
            const model = this.formModel();
            untracked(() =>
                this.draftChange.emit({
                    name: model.name || undefined,
                    description: model.description || undefined,
                    mainTargetBodypart: model.mainTargetBodypart ?? undefined,
                    level: model.level ?? undefined,
                    primaryGoal: model.primaryGoal ?? undefined,
                    availableEquipments: model.availableEquipments,
                    secondaryTargetBodyparts: model.secondaryTargetBodyparts,
                    generatedByAi: model.generatedByAi
                })
            );
        });

        // Keep Bodyweight always selected in form state (UI option is disabled).
        effect(() => {
            const model = this.formModel();
            const normalized = ensureBodyweightIncluded(model.availableEquipments);
            if (normalized.length !== model.availableEquipments.length || normalized.some((v, i) => v !== model.availableEquipments[i])) {
                untracked(() => this.formModel.update((m) => ({ ...m, availableEquipments: normalized })));
            }
        });
    }

    onGenerateWithAi(): void {
        if (this.infoForm().invalid()) return;
        const model = this.formModel();
        const mainTarget = model.mainTargetBodypart;
        if (!mainTarget) return;
        const level = model.level;
        const primaryGoal = model.primaryGoal;
        if (!level || !primaryGoal) return;
        const name = model.name;
        const description = model.description;
        if (!name || !description) return;

        this.isGenerating.set(true);
        this.aiWorkoutGeneration
            .generateWorkout({
                name,
                description,
                mainTargetBodypart: mainTarget,
                availableEquipments: model.availableEquipments ?? [],
                secondaryTargetBodyparts: model.secondaryTargetBodyparts ?? [],
                level,
                primaryGoal
            })
            .pipe(finalize(() => this.isGenerating.set(false)))
            .subscribe({
                next: (generated) => {
                    // Pin structure into draft + snapshot, then clear the lock so warmup/main/cooldown
                    // tabs stay editable while the user reviews the success sheet.
                    this.workoutEditorFacade.lockAiGeneratedStructure(generated);
                    this.workoutEditorFacade.clearAiStructureLock();
                    this.formModel.update((m) => ({ ...m, generatedByAi: true }));
                    void this.openAiGeneratedSuccessSheet();
                }
            });
    }

    private async openAiGeneratedSuccessSheet(): Promise<void> {
        const sheet = await this.actionSheetCtrl.create({
            header: 'Workout generated successfully',
            subHeader: 'You can navigate to the workout tabs to edit and save the workout.',
            cssClass: 'tbt-action-sheet-visible',
            buttons: [{ text: 'Got it', role: 'cancel' }]
        });
        await sheet.present();
    }
}
