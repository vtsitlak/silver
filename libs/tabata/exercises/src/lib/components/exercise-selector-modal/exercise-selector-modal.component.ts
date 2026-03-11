import { Component, ChangeDetectionStrategy, inject, input, signal, computed, OnInit } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonBadge,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonIcon,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSelect,
    IonSelectOption
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';

@Component({
    selector: 'tbt-exercise-selector-modal',
    templateUrl: 'exercise-selector-modal.component.html',
    styleUrls: ['exercise-selector-modal.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonBadge,
        IonContent,
        IonSearchbar,
        IonList,
        IonItem,
        IonLabel,
        IonCheckbox,
        IonIcon,
        IonSpinner,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonSelect,
        IonSelectOption
    ]
})
export class ExerciseSelectorModalComponent implements OnInit {
    private readonly facade = inject(ExercisesFacade);
    private readonly modalCtrl = inject(ModalController);

    readonly multiple = input<boolean>(true);
    readonly preselectedIds = input<string[]>([]);
    readonly maxSelection = input<number | null>(null);

    readonly exercises = this.facade.exercises;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;
    readonly musclesList = this.facade.musclesList;
    readonly equipmentList = this.facade.equipmentList;
    readonly bodyPartList = this.facade.bodyPartList;

    readonly searchTerm = signal('');
    readonly selectedMuscles = signal<string[]>([]);
    readonly selectedEquipment = signal<string[]>([]);
    readonly selectedBodyParts = signal<string[]>([]);
    readonly selectedExercises = signal<Map<string, Exercise>>(new Map());

    private currentOffset = 0;
    private readonly pageSize = 20;
    private lastLoadMoreTime = 0;
    private readonly loadMoreThrottleMs = 1500;

    readonly selectedCount = computed(() => this.selectedExercises().size);

    readonly newlySelectedCount = computed(() => {
        const selected = this.selectedExercises();
        const preselectedIds = this.preselectedIds();
        let count = 0;
        selected.forEach((_, id) => {
            if (!preselectedIds.includes(id)) count++;
        });
        return count;
    });

    readonly canSelectMore = computed(() => {
        const max = this.maxSelection();
        if (max === null) return true;
        return this.selectedCount() < max;
    });

    readonly filteredExercises = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const muscles = this.selectedMuscles();
        const equipment = this.selectedEquipment();
        const bodyParts = this.selectedBodyParts();

        let result = this.exercises();

        if (term) {
            result = result.filter((ex) => ex.name.toLowerCase().includes(term));
        }

        if (muscles.length > 0) {
            const lower = muscles.map((m) => m.toLowerCase());
            result = result.filter((ex) => ex.targetMuscles.some((m) => lower.includes(m.toLowerCase())));
        }

        if (equipment.length > 0) {
            const lower = equipment.map((e) => e.toLowerCase());
            result = result.filter((ex) => ex.equipments.some((e) => lower.includes(e.toLowerCase())));
        }

        if (bodyParts.length > 0) {
            const lower = bodyParts.map((bp) => bp.toLowerCase());
            result = result.filter((ex) => ex.bodyParts.some((bp) => lower.includes(bp.toLowerCase())));
        }

        return result;
    });

    constructor() {
        addIcons({ checkmark });
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

    onDidDismiss(): void {
        // No-op when presented via ModalController; backdrop dismiss is handled by Ionic
    }

    onSearchInput(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.searchTerm.set(customEv.detail?.value ?? '');
    }

    onMuscleChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value;
        this.selectedMuscles.set(Array.isArray(v) ? v : v ? [v] : []);
    }

    onEquipmentChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value;
        this.selectedEquipment.set(Array.isArray(v) ? v : v ? [v] : []);
    }

    onBodyPartChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value;
        this.selectedBodyParts.set(Array.isArray(v) ? v : v ? [v] : []);
    }

    clearFilters(): void {
        this.selectedMuscles.set([]);
        this.selectedEquipment.set([]);
        this.selectedBodyParts.set([]);
        this.searchTerm.set('');
    }

    resetSelections(): void {
        const preselected = this.preselectedIds();
        if (preselected.length === 0) {
            this.selectedExercises.set(new Map());
            return;
        }
        const exercises = this.exercises();
        const map = new Map<string, Exercise>();
        preselected.forEach((id) => {
            const exercise = exercises.find((ex) => ex.exerciseId === id);
            if (exercise) map.set(id, exercise);
        });
        this.selectedExercises.set(map);
    }

    isSelected(exercise: Exercise): boolean {
        return this.selectedExercises().has(exercise.exerciseId);
    }

    isPreselected(exercise: Exercise): boolean {
        return this.preselectedIds().includes(exercise.exerciseId);
    }

    toggleSelection(exercise: Exercise): void {
        if (this.isPreselected(exercise)) return;

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

        if (this.isLoading()) {
            infiniteScroll.complete();
            return;
        }
        if (Date.now() - this.lastLoadMoreTime < this.loadMoreThrottleMs) {
            infiniteScroll.complete();
            return;
        }

        this.lastLoadMoreTime = Date.now();
        this.facade.getAllExercises({ limit: this.pageSize, offset: this.currentOffset });
        this.currentOffset += this.pageSize;

        setTimeout(() => {
            infiniteScroll.complete();
        }, 800);
    }

    confirm(): void {
        const preselectedIds = this.preselectedIds();
        const selected = Array.from(this.selectedExercises().values()).filter((ex) => !preselectedIds.includes(ex.exerciseId));
        this.modalCtrl.dismiss({ selected }, 'confirm');
    }

    cancel(): void {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    formatName(name: string): string {
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
