import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import {
    IonButton,
    IonItem,
    IonList,
    IonIcon,
    IonReorderGroup,
    IonReorder
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { DurationInputModalComponent } from '@silver/tabata/ui';
import type { WorkoutDraft } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { Exercise, ExerciseSelectorModalComponent, ExerciseDetailsModalComponent } from '@silver/tabata/exercises';
import type { Phase } from '@silver/tabata/states/workouts';

export type WorkoutPhaseType = 'warmup' | 'cooldown';

export interface PhaseExerciseItem {
    exercise: Exercise;
    durationSeconds?: number;
}

@Component({
    selector: 'tbt-workout-phase',
    templateUrl: 'workout-phase.component.html',
    styleUrls: ['workout-phase.component.scss'],
    imports: [
        IonButton,
        IonItem,
        IonList,
        IonIcon,
        IonReorderGroup,
        IonReorder,
        DurationInputModalComponent
    ]
})
export class WorkoutPhaseComponent {
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly modalCtrl = inject(ModalController);

    /** Phase from the loaded workout (stable until a new workout is loaded). */
    readonly loadedPhase = input<Phase | null>(null);
    readonly phaseType = input.required<WorkoutPhaseType>();

    readonly draftChange = output<Partial<WorkoutDraft>>();

    readonly phaseItems = signal<PhaseExerciseItem[]>([]);
    readonly durationModalOpen = signal(false);
    readonly durationModalItemIndex = signal<number | null>(null);
    readonly durationInputSeconds = signal<number>(60);

    readonly totalDurationSeconds = computed(() => this.phaseItems().reduce((sum, p) => sum + (p.durationSeconds ?? 0), 0));

    readonly editingItem = computed(() => {
        const idx = this.durationModalItemIndex();
        const items = this.phaseItems();
        return idx != null && idx >= 0 && idx < items.length ? items[idx] : null;
    });

    readonly durationModalExerciseName = computed(() => {
        const item = this.editingItem();
        return item?.exercise ? this.getExerciseName(item.exercise) : null;
    });

    constructor() {
        addIcons({ createOutline, trashOutline });

        // `loadedPhase` comes from `workout()` in the parent; it only changes when that workout changes, not on draft patches.
        effect(() => {
            const loaded = this.loadedPhase();
            untracked(() => {
                const movements = loaded?.movements;
                if (!movements?.length) {
                    this.phaseItems.set([]);
                    return;
                }
                const ids = movements.map((m) => m.exerciseId).filter(Boolean);
                this.exercisesFacade.loadExercisesMap(ids);
                this.phaseItems.set(
                    movements.map((m) => ({
                        exercise: this.placeholderExercise(m.exerciseId),
                        durationSeconds: m.durationSeconds ?? 60
                    }))
                );
            });
        });

        /** Replace placeholder exercises with `ExercisesFacade.exercisesMap()` entries when the map loads or updates. */
        effect(() => {
            const map = this.exercisesFacade.exercisesMap();
            const items = this.phaseItems();
            if (items.length === 0) return;
            untracked(() => {
                const next = items.map((item) => {
                    const fromMap = map[item.exercise.exerciseId];
                    return fromMap ? { ...item, exercise: fromMap } : item;
                });
                const changed = next.some((n, i) => n.exercise !== items[i].exercise);
                if (changed) {
                    this.phaseItems.set(next);
                }
            });
        });

        // Do not call `loadExercisesMap` in an effect on `phaseItems` — the merge above updates
        // `phaseItems` when the map loads, which would re-trigger loads in an infinite loop.

        effect(() => {
            const items = this.phaseItems();
            const phase = this.phaseType();
            const movements = items.map((p) => ({
                exerciseId: p.exercise.exerciseId,
                durationSeconds: p.durationSeconds ?? 0
            }));
            const totalDurationSeconds = items.reduce((sum, p) => sum + (p.durationSeconds ?? 0), 0);
            const phaseData: Phase = { totalDurationSeconds, movements };
            untracked(() => {
                this.draftChange.emit(phase === 'warmup' ? { warmup: phaseData } : { cooldown: phaseData });
            });
        });
    }

    onExerciseSelected(exercises: Exercise[]): void {
        const existingIds = new Set(this.phaseItems().map((p) => p.exercise.exerciseId));
        const toAdd = exercises.filter((ex) => !existingIds.has(ex.exerciseId)).map((ex) => ({ exercise: ex, durationSeconds: 60 }));
        this.phaseItems.update((prev) => [...prev, ...toAdd]);
    }

    openExerciseSelectorModal(): void {
        this.modalCtrl
            .create({
                component: ExerciseSelectorModalComponent,
                componentProps: {
                    multiple: signal(true),
                    preselectedIds: signal(this.phaseItems().map((p) => p.exercise.exerciseId)),
                    maxSelection: signal<number | null>(null)
                },
                cssClass: 'exercise-selector-modal-sheet'
            })
            .then((modal) => {
                modal.onDidDismiss().then(({ data, role }) => {
                    if (role === 'confirm' && data?.selected) {
                        this.onExerciseSelected(data.selected);
                    }
                });
                return modal.present();
            });
    }

    removePhaseItem(index: number): void {
        const editingIndex = this.durationModalItemIndex();
        this.phaseItems.update((prev) => prev.filter((_, i) => i !== index));
        if (editingIndex !== null && editingIndex === index) {
            this.closeDurationModal();
        } else if (editingIndex !== null && editingIndex > index) {
            this.durationModalItemIndex.set(editingIndex - 1);
        }
    }

    handleReorderEnd(event: CustomEvent<{ from: number; to: number; complete: (data?: boolean | unknown[]) => void }>): void {
        const { from, to, complete } = event.detail;
        if (from === to) {
            complete(true);
            return;
        }
        const items = [...this.phaseItems()];
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        this.phaseItems.set(items);
        const editingIndex = this.durationModalItemIndex();
        if (editingIndex !== null) {
            if (editingIndex === from) {
                this.durationModalItemIndex.set(to);
            } else if (from < editingIndex && to >= editingIndex) {
                this.durationModalItemIndex.set(editingIndex - 1);
            } else if (from > editingIndex && to <= editingIndex) {
                this.durationModalItemIndex.set(editingIndex + 1);
            }
        }
        complete(true);
    }

    openDurationModal(index: number): void {
        const items = this.phaseItems();
        const item = items[index];
        this.durationModalItemIndex.set(index);
        this.durationInputSeconds.set(item.durationSeconds ?? 60);
        this.durationModalOpen.set(true);
    }

    closeDurationModal(): void {
        this.durationModalOpen.set(false);
        this.durationModalItemIndex.set(null);
    }

    openExerciseDetailsModal(exerciseId: string): void {
        if (!exerciseId) return;
        const exerciseIdSignal = signal<string>(exerciseId);
        this.modalCtrl
            .create({
                component: ExerciseDetailsModalComponent,
                componentProps: { exerciseId: exerciseIdSignal },
                cssClass: 'exercise-details-modal-sheet'
            })
            .then((modal) => modal.present());
    }

    saveDuration(): void {
        const idx = this.durationModalItemIndex();
        const seconds = this.durationInputSeconds();
        if (idx != null && seconds > 0) {
            this.phaseItems.update((prev) => prev.map((p, i) => (i === idx ? { ...p, durationSeconds: seconds } : p)));
        }
        this.closeDurationModal();
    }

    formatDuration(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s ? `${m}m ${s}s` : `${m}m`;
    }

    private placeholderExercise(exerciseId: string): Exercise {
        return {
            exerciseId,
            name: '',
            images: [],
            targetMuscles: [],
            category: [],
            equipments: [],
            secondaryMuscles: [],
            instructions: []
        } as Exercise;
    }

    /** Prefer `exercisesMap` (API); fall back to `exercise.name` (merged row or selector). */
    getExerciseName(exercise: Exercise): string {
        const fromMap = this.exercisesFacade.exercisesMap()[exercise.exerciseId]?.name;
        return (fromMap ?? exercise.name)?.trim() || '';
    }

    /**
     * Prefer images on the merged `Exercise` — `exercisesMap` is merged across loads and may omit
     * ids loaded in another tab/context until the next fetch.
     */
    getExerciseImage(exercise: Exercise): string {
        const fromExercise = exercise.images?.[0];
        if (fromExercise) return fromExercise;
        const images = this.exercisesFacade.exercisesMap()[exercise.exerciseId]?.images;
        return images?.length ? images[0] : '';
    }
}
