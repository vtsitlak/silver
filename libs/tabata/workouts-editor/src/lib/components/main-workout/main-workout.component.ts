import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonContent, IonFooter, IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonIcon, IonList } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { Exercise, ExerciseSelectorModalComponent, ExerciseDetailsModalComponent } from '@silver/tabata/exercises';
import type { TabataBlock } from '@silver/tabata/states/workouts';

const WORK_SECONDS = 20;
const REST_SECONDS = 10;
const DEFAULT_ROUNDS = 8;
const DEFAULT_INTER_BLOCK_REST_SECONDS = 60;

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
    standalone: true,
    imports: [IonHeader, IonContent, IonFooter, IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonIcon, IonList, ToolbarComponent]
})
export class MainWorkoutComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly modalCtrl = inject(ModalController);

    readonly workoutId = signal<string | null>(null);
    readonly isEditMode = signal(false);
    readonly blocks = signal<MainWorkoutBlockItem[]>([]);
    readonly blockIndexForExerciseModal = signal<number | null>(null);

    readonly draft = this.facade.workoutDraft;

    readonly pageTitle = computed(() => (this.isEditMode() ? 'Edit Main Workout' : 'Main Workout'));

    readonly backHref = computed(() => {
        const id = this.workoutId();
        if (this.isEditMode() && id) {
            return `/tabs/workouts/edit/${id}/warmup`;
        }
        return '/tabs/workouts/create/warmup';
    });

    readonly canGoNext = computed(() => {
        const blks = this.blocks();
        return blks.length > 0 && blks.every((b) => b.exercise != null);
    });

    readonly workSeconds = WORK_SECONDS;
    readonly restSeconds = REST_SECONDS;
    readonly interBlockRestSeconds = DEFAULT_INTER_BLOCK_REST_SECONDS;

    readonly totalDurationMinutes = computed(() => {
        const count = this.blocks().length;
        if (!count) {
            return 0;
        }
        const blockSeconds = DEFAULT_ROUNDS * (WORK_SECONDS + REST_SECONDS);
        const totalBlocksSeconds = blockSeconds * count;
        const totalRestSeconds = DEFAULT_INTER_BLOCK_REST_SECONDS * Math.max(count - 1, 0);
        return Math.ceil((totalBlocksSeconds + totalRestSeconds) / 60);
    });

    private readonly hasSyncedDraft = signal(false);

    constructor() {
        addIcons({ createOutline, trashOutline });
        effect(() => {
            const d = this.draft();
            const synced = this.hasSyncedDraft();
            const isEdit = this.route.snapshot.paramMap.get('workoutId');
            if (synced) return;
            const draftBlocks = d.blocks;
            if (draftBlocks?.length && isEdit) {
                this.hasSyncedDraft.set(true);
                untracked(() => {
                    this.blocks.set(
                        draftBlocks.map((b) => {
                            const id = b.exerciseId ?? (b as { exercises?: string[] }).exercises?.[0];
                            return {
                                rounds: b.rounds ?? DEFAULT_ROUNDS,
                                workDurationSeconds: b.workDurationSeconds ?? WORK_SECONDS,
                                restDurationSeconds: b.restDurationSeconds ?? REST_SECONDS,
                                exercise: id
                                    ? ({
                                          exerciseId: id,
                                          name: this.formatIdAsDisplayName(id),
                                          gifUrl: '',
                                          targetMuscles: [],
                                          bodyParts: [],
                                          equipments: [],
                                          secondaryMuscles: [],
                                          instructions: []
                                      } as Exercise)
                                    : null,
                                interBlockRestSeconds: b.interBlockRestSeconds ?? DEFAULT_INTER_BLOCK_REST_SECONDS
                            };
                        })
                    );
                });
            }
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('workoutId');
        if (id) {
            this.workoutId.set(id);
            this.isEditMode.set(true);
            const existing = this.facade.workout();
            if (existing?.id !== id) {
                this.facade.loadWorkout(id);
            }
        }
        if (this.blocks().length === 0 && !this.draft().blocks?.length) {
            this.addBlock();
        }
    }

    onCancel(): void {
        this.router.navigate(['/tabs/workouts']);
    }

    onNext(): void {
        if (!this.canGoNext()) return;
        const blks = this.blocks();
        const tabataBlocks: TabataBlock[] = blks.map((b) => ({
            rounds: DEFAULT_ROUNDS,
            workDurationSeconds: b.workDurationSeconds,
            restDurationSeconds: b.restDurationSeconds,
            exerciseId: b.exercise?.exerciseId ?? '',
            interBlockRestSeconds: b.interBlockRestSeconds
        }));
        this.facade.updateDraft({ blocks: tabataBlocks });
        const id = this.workoutId();
        if (this.isEditMode() && id) {
            this.router.navigate(['/tabs/workouts/edit', id, 'cooldown']);
        } else {
            this.router.navigate(['/tabs/workouts/create/cooldown']);
        }
    }

    addBlock(): void {
        this.blocks.update((prev) => [
            ...prev,
            {
                rounds: DEFAULT_ROUNDS,
                workDurationSeconds: WORK_SECONDS,
                restDurationSeconds: REST_SECONDS,
                exercise: null,
                interBlockRestSeconds: DEFAULT_INTER_BLOCK_REST_SECONDS
            }
        ]);
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

    formatName(name: string): string {
        return name
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    /** Format a raw exercise id as a readable label when we don't have the full exercise (e.g. from draft). */
    private formatIdAsDisplayName(id: string): string {
        if (!id) return id;
        return id
            .replace(/[-_]/g, ' ')
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }
}
