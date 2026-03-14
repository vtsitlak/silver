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
import { ExerciseFilterService } from '../../services/exercise-filter.service';

@Component({
    selector: 'tbt-exercise-selector-modal',
    templateUrl: 'exercise-selector-modal.component.html',
    styleUrls: ['exercise-selector-modal.component.scss'],
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
    private readonly filterService = inject(ExerciseFilterService);

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

    readonly filteredExercises = computed(() => this.exercises());

    constructor() {
        addIcons({ checkmark });
    }

    ngOnInit(): void {
        // Ensure we have an initial page of exercises when the modal opens.
        this.facade.filterExercises({
            limit: this.pageSize,
            offset: 0,
            sortBy: 'name',
            sortOrder: 'desc'
        });
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
        const value = (customEv.detail?.value ?? '') as string;
        this.searchTerm.set(value);
        this.filterService.updateFilters({ term: value.toLowerCase().trim() });
    }

    onMuscleChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value as string | string[] | undefined;
        const next = Array.isArray(v) ? v : v ? [v] : [];
        this.selectedMuscles.set(next);
        this.filterService.updateFilters({ muscles: next });
    }

    onEquipmentChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value as string | string[] | undefined;
        const next = Array.isArray(v) ? v : v ? [v] : [];
        this.selectedEquipment.set(next);
        this.filterService.updateFilters({ equipment: next });
    }

    onBodyPartChange(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string | string[] }>;
        const v = customEv.detail?.value as string | string[] | undefined;
        const next = Array.isArray(v) ? v : v ? [v] : [];
        this.selectedBodyParts.set(next);
        this.filterService.updateFilters({ bodyParts: next });
    }

    clearFilters(): void {
        this.selectedMuscles.set([]);
        this.selectedEquipment.set([]);
        this.selectedBodyParts.set([]);
        this.searchTerm.set('');
        this.filterService.updateFilters({
            term: '',
            muscles: [],
            equipment: [],
            bodyParts: []
        });
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
        this.filterService.loadMore();

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
