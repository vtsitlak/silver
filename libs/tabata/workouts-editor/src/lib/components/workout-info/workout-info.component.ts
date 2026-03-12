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
import { EQUIPMENT_CATEGORY_OPTIONS, BODY_REGION_OPTIONS, type EquipmentCategory, type BodyRegion } from '@silver/shared/helpers';
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
    standalone: true,
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
        this.facade.updateDraft({
            generatedByAi: true
        });
        // TODO: wire to AI generation
    }

    onCancel(): void {
        this.facade.clearDraft();
        this.router.navigate(['/tabs/workouts']);
    }

    onSubmit(): void {
        if (this.infoForm().invalid()) return;
        const m = this.infoModel();
        this.facade.updateDraft({
            name: m.name || undefined,
            description: m.description || undefined,
            mainTargetBodypart: m.mainTargetBodypart ?? undefined,
            availableEquipments: m.availableEquipments,
            secondaryTargetBodyparts: m.secondaryTargetBodyparts,
            generatedByAi: m.generatedByAi
        });
        const id = this.workoutId();
        if (id) {
            this.router.navigate(['/tabs/workouts/edit', id, 'warmup']);
        } else {
            this.router.navigate(['/tabs/workouts/create/warmup']);
        }
    }
}
