import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonSpinner, IonTextarea, ModalController } from '@ionic/angular/standalone';
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
import { SKIP_WORKOUT_EDITOR_CANCEL } from '../../guards/workout-editor-can-deactivate.guard';
import { AiWorkoutGenerationService } from '../../services/ai-workout-generation.service';
import { AiWorkoutPreviewModalComponent } from '../ai-workout-preview-modal/ai-workout-preview-modal.component';
import { finalize } from 'rxjs/operators';
import type { WorkoutInfoFormModel } from '@silver/tabata/states/workouts';

@Component({
    selector: 'tbt-workout-info',
    templateUrl: 'workout-info.component.html',
    styleUrls: ['workout-info.component.scss'],
    imports: [IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonSpinner, IonTextarea, FormField]
})
export class WorkoutInfoComponent {
    private readonly aiWorkoutGeneration = inject(AiWorkoutGenerationService);
    private readonly router = inject(Router);
    private readonly modalCtrl = inject(ModalController);

    /** Snapshot from the editor's loaded workout (not live draft) — avoids parent↔draft feedback loops. */
    readonly loadedInfo = input<WorkoutInfoFormModel | null>(null);

    /** When `false` (edit existing workout), AI generation UI is hidden. */
    readonly isCreateMode = input(true);

    readonly draftChange = output<Partial<WorkoutDraft>>();
    /** Emitted when AI preview is cancelled — parent clears draft / resets as needed. */
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
        this.isGenerating.set(true);
        const name = model.name;
        const description = model.description;
        if (!name || !description) return;

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
                    this.draftChange.emit({
                        totalDurationMinutes: generated.totalDurationMinutes,
                        warmup: generated.warmup,
                        blocks: generated.blocks,
                        cooldown: generated.cooldown,
                        generatedByAi: true
                    });

                    this.formModel.update((m) => ({ ...m, generatedByAi: true }));
                    this.openAiPreviewModal();
                }
            });
    }

    private openAiPreviewModal(): void {
        this.modalCtrl
            .create({
                component: AiWorkoutPreviewModalComponent,
                cssClass: 'ai-workout-preview-modal-sheet'
            })
            .then((modal) => {
                modal.onDidDismiss().then(({ role }) => {
                    const typedRole = role as 'save' | 'tryAgain' | 'cancel' | undefined;
                    if (typedRole === 'save') {
                        /** Same as {@link WorkoutsFacade} after save — skip can-deactivate confirm (draft still looks “dirty”). */
                        this.router.navigate(['/tabs/workouts'], {
                            state: { [SKIP_WORKOUT_EDITOR_CANCEL]: true }
                        });
                    } else if (typedRole === 'tryAgain') {
                        this.onGenerateWithAi();
                    } else if (typedRole === 'cancel') {
                        this.clearDraftRequested.emit();
                        this.router.navigate(['/tabs/workouts'], {
                            state: { [SKIP_WORKOUT_EDITOR_CANCEL]: true }
                        });
                    }
                });
                return modal.present();
            });
    }
}
