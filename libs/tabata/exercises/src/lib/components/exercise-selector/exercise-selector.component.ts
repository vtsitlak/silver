import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonIcon,
    IonChip,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonSelect,
    IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark, filterOutline } from 'ionicons/icons';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';

@Component({
    selector: 'lib-exercise-selector',
    templateUrl: 'exercise-selector.component.html',
    styleUrls: ['exercise-selector.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonSearchbar,
        IonList,
        IonItem,
        IonLabel,
        IonCheckbox,
        IonIcon,
        IonChip,
        IonSpinner,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonModal,
        IonSelect,
        IonSelectOption
    ]
})
export class ExerciseSelectorComponent implements OnInit {
    private readonly facade = inject(ExercisesFacade);

    readonly multiple = input<boolean>(false);
    readonly preselectedIds = input<string[]>([]);
    readonly maxSelection = input<number | null>(null);

    readonly selectionConfirmed = output<Exercise[]>();
    readonly selectionCancelled = output<void>();

    readonly exercises = this.facade.exercises;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;
    readonly musclesList = this.facade.musclesList;
    readonly equipmentList = this.facade.equipmentList;
    readonly bodyPartList = this.facade.bodyPartList;

    readonly searchTerm = signal('');
    readonly selectedMuscle = signal<string | null>(null);
    readonly selectedEquipment = signal<string | null>(null);
    readonly selectedBodyPart = signal<string | null>(null);
    readonly selectedExercises = signal<Map<string, Exercise>>(new Map());

    private currentOffset = 0;
    private readonly pageSize = 20;

    readonly selectedCount = computed(() => this.selectedExercises().size);

    readonly canSelectMore = computed(() => {
        const max = this.maxSelection();
        if (max === null) return true;
        return this.selectedCount() < max;
    });

    readonly filteredExercises = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const muscle = this.selectedMuscle();
        const equipment = this.selectedEquipment();
        const bodyPart = this.selectedBodyPart();

        let result = this.exercises();

        if (term) {
            result = result.filter((ex) => ex.name.toLowerCase().includes(term));
        }

        if (muscle) {
            result = result.filter((ex) => ex.targetMuscles.some((m) => m.toLowerCase() === muscle.toLowerCase()));
        }

        if (equipment) {
            result = result.filter((ex) => ex.equipments.some((e) => e.toLowerCase() === equipment.toLowerCase()));
        }

        if (bodyPart) {
            result = result.filter((ex) => ex.bodyParts.some((bp) => bp.toLowerCase() === bodyPart.toLowerCase()));
        }

        return result;
    });

    constructor() {
        addIcons({ close, checkmark, filterOutline });
    }

    ngOnInit(): void {
        this.loadExercises();
        this.loadFilterOptions();
        this.initializePreselected();
    }

    private loadExercises(): void {
        this.facade.getAllExercises({ limit: this.pageSize, offset: 0 });
        this.currentOffset = this.pageSize;
    }

    private loadFilterOptions(): void {
        this.facade.getMusclesList();
        this.facade.getEquipmentList();
        this.facade.getBodyPartList();
    }

    private initializePreselected(): void {
        const preselected = this.preselectedIds();
        if (preselected.length > 0) {
            const map = new Map<string, Exercise>();
            const exercises = this.exercises();
            preselected.forEach((id) => {
                const exercise = exercises.find((ex) => ex.exerciseId === id);
                if (exercise) {
                    map.set(id, exercise);
                }
            });
            this.selectedExercises.set(map);
        }
    }

    onSearchInput(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.searchTerm.set(customEv.detail?.value ?? '');
    }

    onMuscleChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.selectedMuscle.set(customEv.detail?.value || null);
    }

    onEquipmentChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.selectedEquipment.set(customEv.detail?.value || null);
    }

    onBodyPartChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.selectedBodyPart.set(customEv.detail?.value || null);
    }

    clearFilters(): void {
        this.selectedMuscle.set(null);
        this.selectedEquipment.set(null);
        this.selectedBodyPart.set(null);
        this.searchTerm.set('');
    }

    isSelected(exercise: Exercise): boolean {
        return this.selectedExercises().has(exercise.exerciseId);
    }

    toggleSelection(exercise: Exercise): void {
        const map = new Map(this.selectedExercises());

        if (map.has(exercise.exerciseId)) {
            map.delete(exercise.exerciseId);
        } else {
            if (!this.multiple()) {
                map.clear();
            }

            if (this.canSelectMore()) {
                map.set(exercise.exerciseId, exercise);
            }
        }

        this.selectedExercises.set(map);
    }

    loadMore(event: Event): void {
        const infiniteScroll = event.target as HTMLIonInfiniteScrollElement;

        this.facade.getAllExercises({ limit: this.pageSize, offset: this.currentOffset });
        this.currentOffset += this.pageSize;

        setTimeout(() => {
            infiniteScroll.complete();
        }, 500);
    }

    confirm(): void {
        const selected = Array.from(this.selectedExercises().values());
        this.selectionConfirmed.emit(selected);
    }

    cancel(): void {
        this.selectionCancelled.emit();
    }

    formatName(name: string): string {
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
