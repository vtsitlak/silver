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
    IonIcon
} from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';
import { EQUIPMENT_CATEGORY_OPTIONS, BODY_REGION_OPTIONS, type EquipmentCategory, type BodyRegion } from '@silver/tabata/helpers';
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
        FormField,
        ToolbarComponent
    ]
})
export class WorkoutInfoComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly cancelService = inject(WorkoutEditorCancelService);

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
        this.infoModel.set({ ...this.infoModel(), generatedByAi: true });
        // TODO: wire to AI generation (draft is synced via effect)
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
