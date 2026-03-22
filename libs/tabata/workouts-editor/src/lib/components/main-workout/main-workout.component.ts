import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { IonButton, IonButtons, IonLabel, IonItem, IonIcon, IonList, IonReorderGroup, IonReorder } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import {
    DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS,
    DEFAULT_TABATA_REST_DURATION_SECONDS,
    DEFAULT_TABATA_ROUNDS,
    DEFAULT_TABATA_WORK_DURATION_SECONDS,
    type WorkoutDraft
} from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { Exercise, ExerciseSelectorModalComponent, ExerciseDetailsModalComponent } from '@silver/tabata/exercises';
import type { TabataBlock } from '@silver/tabata/states/workouts';

export interface MainWorkoutBlockItem {
    rounds: number;
    workDurationSeconds: number;
    restDurationSeconds: number;
    exercise: Exercise | null;
    interBlockRestSeconds: number;
}

@Component({
    selector: 'tbt-main-workout',
    templateUrl: 'main-workout.component.html',
    styleUrls: ['main-workout.component.scss'],
    imports: [IonButton, IonButtons, IonLabel, IonItem, IonIcon, IonList, IonReorderGroup, IonReorder]
})
export class MainWorkoutComponent {
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly modalCtrl = inject(ModalController);

    /** Blocks from the loaded workout (stable until a new workout is loaded). */
    readonly loadedBlocks = input<TabataBlock[]>([]);

    readonly draftChange = output<Partial<WorkoutDraft>>();

    readonly blocks = signal<MainWorkoutBlockItem[]>([]);
    readonly blockIndexForExerciseModal = signal<number | null>(null);

    readonly workSeconds = DEFAULT_TABATA_WORK_DURATION_SECONDS;
    readonly restSeconds = DEFAULT_TABATA_REST_DURATION_SECONDS;
    readonly interBlockRestSeconds = DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS;

    readonly totalDurationMinutes = computed(() => {
        const count = this.blocks().length;
        if (!count) {
            return 0;
        }
        const blockSeconds = DEFAULT_TABATA_ROUNDS * (DEFAULT_TABATA_WORK_DURATION_SECONDS + DEFAULT_TABATA_REST_DURATION_SECONDS);
        const totalBlocksSeconds = blockSeconds * count;
        const totalRestSeconds = DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS * Math.max(count - 1, 0);
        return Math.ceil((totalBlocksSeconds + totalRestSeconds) / 60);
    });

    constructor() {
        addIcons({ createOutline, trashOutline });

        // `loadedBlocks` comes from `workout()` in the parent; it only changes when that workout changes, not on draft patches.
        effect(() => {
            const loaded = this.loadedBlocks();
            untracked(() => {
                if (!loaded?.length) {
                    this.blocks.set([]);
                    return;
                }
                const ids = loaded.map((b) => b.exerciseId ?? (b as { exercises?: string[] }).exercises?.[0]).filter(Boolean) as string[];
                this.exercisesFacade.loadExercisesMap(ids);
                this.blocks.set(
                    loaded.map((b) => {
                        const id = b.exerciseId ?? (b as { exercises?: string[] }).exercises?.[0];
                        return {
                            rounds: b.rounds ?? DEFAULT_TABATA_ROUNDS,
                            workDurationSeconds: b.workDurationSeconds ?? DEFAULT_TABATA_WORK_DURATION_SECONDS,
                            restDurationSeconds: b.restDurationSeconds ?? DEFAULT_TABATA_REST_DURATION_SECONDS,
                            exercise: id ? this.placeholderExercise(id) : null,
                            interBlockRestSeconds: b.interBlockRestSeconds ?? DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS
                        };
                    })
                );
            });
        });

        /** Replace placeholder exercises with `ExercisesFacade.exercisesMap()` entries when the map loads or updates. */
        effect(() => {
            const map = this.exercisesFacade.exercisesMap();
            const blks = this.blocks();
            if (blks.length === 0) return;
            untracked(() => {
                const next = blks.map((block) => {
                    if (!block.exercise) return block;
                    const fromMap = map[block.exercise.exerciseId];
                    return fromMap ? { ...block, exercise: fromMap } : block;
                });
                const changed = next.some((n, i) => n.exercise !== blks[i].exercise);
                if (changed) {
                    this.blocks.set(next);
                }
            });
        });

        // Do not call `loadExercisesMap` in an effect on `blocks` — the merge above updates
        // `blocks` when the map loads, which would re-trigger loads in an infinite loop.

        effect(() => {
            const blks = this.blocks();
            const tabataBlocks: TabataBlock[] = blks.map((b) => ({
                rounds: DEFAULT_TABATA_ROUNDS,
                workDurationSeconds: b.workDurationSeconds,
                restDurationSeconds: b.restDurationSeconds,
                exerciseId: b.exercise?.exerciseId ?? '',
                interBlockRestSeconds: b.interBlockRestSeconds
            }));
            untracked(() => {
                this.draftChange.emit({ blocks: tabataBlocks });
            });
        });
    }

    addBlock(): void {
        this.blocks.update((prev) => [
            ...prev,
            {
                rounds: DEFAULT_TABATA_ROUNDS,
                workDurationSeconds: DEFAULT_TABATA_WORK_DURATION_SECONDS,
                restDurationSeconds: DEFAULT_TABATA_REST_DURATION_SECONDS,
                exercise: null,
                interBlockRestSeconds: DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS
            }
        ]);
    }

    openExerciseSelectorForNewBlock(): void {
        this.modalCtrl
            .create({
                component: ExerciseSelectorModalComponent,
                componentProps: {
                    multiple: signal(false),
                    preselectedIds: signal([]),
                    maxSelection: signal<number | null>(null)
                },
                cssClass: 'exercise-selector-modal-sheet'
            })
            .then((modal) => {
                modal.onDidDismiss().then(({ data, role }) => {
                    if (role === 'confirm' && data?.selected?.length) {
                        this.addBlockWithExercise(data.selected[0]);
                    }
                });
                return modal.present();
            });
    }

    private addBlockWithExercise(exercise: Exercise): void {
        this.blocks.update((prev) => [
            ...prev,
            {
                rounds: DEFAULT_TABATA_ROUNDS,
                workDurationSeconds: DEFAULT_TABATA_WORK_DURATION_SECONDS,
                restDurationSeconds: DEFAULT_TABATA_REST_DURATION_SECONDS,
                exercise,
                interBlockRestSeconds: DEFAULT_TABATA_INTER_BLOCK_REST_SECONDS
            }
        ]);
    }

    handleReorderEnd(event: CustomEvent<{ from: number; to: number; complete: (data?: boolean | unknown[]) => void }>): void {
        const { from, to, complete } = event.detail;
        if (from === to) {
            complete(true);
            return;
        }
        const blks = [...this.blocks()];
        const [moved] = blks.splice(from, 1);
        blks.splice(to, 0, moved);
        this.blocks.set(blks);
        complete(true);
    }

    removeBlock(index: number): void {
        this.blocks.update((prev) => prev.filter((_, i) => i !== index));
    }

    openExerciseSelectorForBlock(index: number): void {
        this.blockIndexForExerciseModal.set(index);
        const block = this.blocks()[index];
        const preselectedIds = block?.exercise ? [block.exercise.exerciseId] : [];
        this.modalCtrl
            .create({
                component: ExerciseSelectorModalComponent,
                componentProps: {
                    multiple: signal(false),
                    preselectedIds: signal(preselectedIds),
                    maxSelection: signal<number | null>(null)
                },
                cssClass: 'exercise-selector-modal-sheet'
            })
            .then((modal) => {
                modal.onDidDismiss().then(({ data, role }) => {
                    this.blockIndexForExerciseModal.set(null);
                    if (role === 'confirm' && data?.selected?.length) {
                        this.onExerciseSelectedForBlock(index, data.selected[0]);
                    }
                });
                return modal.present();
            });
    }

    onExerciseSelectedForBlock(blockIndex: number, exercise: Exercise): void {
        this.blocks.update((prev) => prev.map((b, i) => (i === blockIndex ? { ...b, exercise } : b)));
    }

    getExerciseName(exercise: Exercise): string {
        const fromMap = this.exercisesFacade.exercisesMap()[exercise.exerciseId]?.name;
        return (fromMap ?? exercise.name)?.trim() || '';
    }

    getExerciseImage(exercise: Exercise): string {
        const fromExercise = exercise.images?.[0];
        if (fromExercise) return fromExercise;
        const images = this.exercisesFacade.exercisesMap()[exercise.exerciseId]?.images;
        return images?.length ? images[0] : '';
    }

    clearExerciseFromBlock(blockIndex: number): void {
        this.blocks.update((prev) => prev.map((b, i) => (i === blockIndex ? { ...b, exercise: null } : b)));
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
}
