import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import {
    IonHeader,
    IonContent,
    IonButton,
    IonItem,
    IonInput,
    IonList,
    IonTextarea,
    IonButtons,
    IonBackButton,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonFooter,
    IonIcon,
    IonSpinner
} from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';
import { EQUIPMENT_CATEGORY_OPTIONS, BODY_REGION_OPTIONS, type EquipmentCategory, type BodyRegion } from '@silver/tabata/helpers';
import { AiWorkoutGeneratorService } from '@silver/tabata/ai-workout-generator';
import type { ExerciseSummary } from '@silver/tabata/ai-workout-generator';
import { ExercisesService } from '@silver/tabata/states/exercises';
import { addIcons } from 'ionicons';
import { arrowBackOutline, arrowForwardOutline } from 'ionicons/icons';

interface WorkoutInfoFormModel {
    name: string;
    description: string;
    mainTargetBodypart: BodyRegion | null;
    availableEquipments: EquipmentCategory[];
    secondaryTargetBodyparts: BodyRegion[];
    generatedByAi: boolean;
}

@Component({
    selector: 'tbt-workout-info',
    templateUrl: 'workout-info.component.html',
    styleUrls: ['workout-info.component.scss'],
    imports: [
        IonHeader,
        IonContent,
        IonButton,
        IonItem,
        IonInput,
        IonTextarea,
        IonList,
        IonButtons,
        IonBackButton,
        IonSelect,
        IonSelectOption,
        IonLabel,
        IonFooter,
        IonIcon,
        IonSpinner,
        FormField,
        ToolbarComponent
    ]
})
export class WorkoutInfoComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly cancelService = inject(WorkoutEditorCancelService);
    private readonly aiGenerator = inject(AiWorkoutGeneratorService);
    private readonly exercisesService = inject(ExercisesService);

    readonly workoutId = signal<string | null>(null);
    readonly isEditMode = signal(false);
    readonly pageTitle = signal('Workout Info');

    readonly equipmentOptions = EQUIPMENT_CATEGORY_OPTIONS;
    readonly bodyRegionOptions = BODY_REGION_OPTIONS;

    readonly draft = this.facade.workoutDraft;

    readonly mainTargetDisabled = computed(() => (region: BodyRegion) => this.infoModel().secondaryTargetBodyparts.includes(region));
    readonly secondaryTargetDisabled = computed(() => (region: BodyRegion) => this.infoModel().mainTargetBodypart === region);

    readonly infoModel = signal<WorkoutInfoFormModel>({
        name: '',
        description: '',
        mainTargetBodypart: null,
        availableEquipments: [],
        secondaryTargetBodyparts: [],
        generatedByAi: false
    });

    infoForm = form(this.infoModel, (schemaPath) => {
        required(schemaPath.name, { message: 'Name is required' });
        required(schemaPath.description, { message: 'Description is required' });
        required(schemaPath.mainTargetBodypart, { message: 'Main target is required' });
    });

    readonly isFormValid = computed(() => this.infoForm().valid());

    readonly isGenerating = signal(false);
    readonly generateError = signal<string | null>(null);

    private readonly hasSyncedDraftToForm = signal(false);

    constructor() {
        addIcons({ arrowBackOutline, arrowForwardOutline });
        effect(() => {
            const d = this.draft();
            const isEdit = this.isEditMode();
            const synced = this.hasSyncedDraftToForm();
            if (!synced && isEdit && d.name != null && d.name !== '') {
                this.hasSyncedDraftToForm.set(true);
                untracked(() => {
                    this.infoModel.set({
                        name: d.name ?? '',
                        description: d.description ?? '',
                        mainTargetBodypart: d.mainTargetBodypart ?? null,
                        availableEquipments: d.availableEquipments ?? [],
                        secondaryTargetBodyparts: d.secondaryTargetBodyparts ?? [],
                        generatedByAi: d.generatedByAi ?? false
                    });
                });
            }
        });
        effect(() => {
            const model = this.infoModel();
            const canPushToDraft = !this.isEditMode() || this.hasSyncedDraftToForm();
            if (canPushToDraft) {
                untracked(() => {
                    this.facade.updateDraft({
                        name: model.name || undefined,
                        description: model.description || undefined,
                        mainTargetBodypart: model.mainTargetBodypart ?? undefined,
                        availableEquipments: model.availableEquipments,
                        secondaryTargetBodyparts: model.secondaryTargetBodyparts,
                        generatedByAi: model.generatedByAi
                    });
                });
            }
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('workoutId');
        if (id) {
            this.workoutId.set(id);
            this.isEditMode.set(true);
            this.pageTitle.set('Edit Workout');
            const existing = this.facade.workout();
            if (existing?.id !== id) {
                this.facade.loadWorkout(id);
            }
        }
    }

    onGenerateWithAi(): void {
        if (this.infoForm().invalid()) return;
        const model = this.infoModel();
        const mainTarget = model.mainTargetBodypart;
        if (!mainTarget) return;

        this.generateError.set(null);
        this.isGenerating.set(true);

        const equipmentParam = model.availableEquipments?.[0] ?? '';
        this.exercisesService
            .filterExercises({
                limit: 40,
                muscles: mainTarget,
                equipment: equipmentParam,
                sortBy: 'name',
                sortOrder: 'asc'
            })
            .subscribe({
                next: (exercises) => {
                    const summaries: ExerciseSummary[] = exercises.map((e) => ({
                        exerciseId: e.exerciseId,
                        name: e.name,
                        targetMuscles: e.targetMuscles ?? [],
                        category: e.category ?? [],
                        equipments: e.equipments ?? []
                    }));

                    if (summaries.length === 0) {
                        this.generateError.set('No exercises found for the selected target and equipment. Add more or change filters.');
                        this.isGenerating.set(false);
                        return;
                    }

                    this.aiGenerator
                        .generateWorkout({
                            name: model.name,
                            description: model.description,
                            mainTargetBodypart: mainTarget,
                            availableEquipments: model.availableEquipments,
                            secondaryTargetBodyparts: model.secondaryTargetBodyparts,
                            exercises: summaries
                        })
                        .subscribe({
                            next: (output) => {
                                this.facade.updateDraft({
                                    totalDurationMinutes: output.totalDurationMinutes,
                                    warmup: output.warmup,
                                    blocks: output.blocks,
                                    cooldown: output.cooldown,
                                    generatedByAi: true
                                });
                                this.infoModel.set({ ...model, generatedByAi: true });
                                this.isGenerating.set(false);
                            },
                            error: (err) => {
                                this.generateError.set(err?.message ?? 'AI generation failed');
                                this.isGenerating.set(false);
                            }
                        });
                },
                error: () => {
                    this.generateError.set('Failed to load exercises');
                    this.isGenerating.set(false);
                }
            });
    }

    async onCancel(): Promise<void> {
        const stay = await this.cancelService.confirmCancel();
        if (!stay) {
            this.router.navigate(['/tabs/workouts']);
        }
    }

    onSubmit(): void {
        if (this.infoForm().invalid()) return;
        const id = this.workoutId();
        if (id) {
            this.router.navigate(['/tabs/workouts/edit', id, 'warmup']);
        } else {
            this.router.navigate(['/tabs/workouts/create/warmup']);
        }
    }
}
