import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonHeader,
    IonContent,
    IonFooter,
    IonButton,
    IonButtons,
    IonBackButton,
    IonItem,
    IonList,
    IonIcon,
    IonReorderGroup,
    IonReorder
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, arrowBackOutline, arrowForwardOutline, saveOutline } from 'ionicons/icons';
import { ToolbarComponent, DurationInputModalComponent } from '@silver/tabata/ui';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { Exercise, ExerciseSelectorModalComponent, ExerciseDetailsModalComponent } from '@silver/tabata/exercises';
import type { Phase } from '@silver/tabata/states/workouts';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';

export type WorkoutPhaseType = 'warmup' | 'cooldown';

export interface PhaseExerciseItem {
    exercise: Exercise;
    durationSeconds?: number;
}

@Component({
    selector: 'tbt-workout-phase',
    templateUrl: 'workout-phase.component.html',
    styleUrls: ['workout-phase.component.scss'],
    standalone: true,
    imports: [
        IonHeader,
        IonContent,
        IonFooter,
        IonButton,
        IonButtons,
        IonBackButton,
        IonItem,
        IonList,
        IonIcon,
        IonReorderGroup,
        IonReorder,
        ToolbarComponent,
        DurationInputModalComponent
    ]
})
export class WorkoutPhaseComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly modalCtrl = inject(ModalController);
    private readonly workoutSubmitService = inject(WorkoutSubmitService);
    private readonly cancelService = inject(WorkoutEditorCancelService);

    private readonly hasSyncedPhaseFromDraft = signal<WorkoutPhaseType | null>(null);

    constructor() {
        addIcons({ createOutline, trashOutline, arrowBackOutline, arrowForwardOutline, saveOutline });
        const path = this.route.snapshot.routeConfig?.path ?? '';
        const phase = path.endsWith('cooldown') ? 'cooldown' : 'warmup';
        this.phaseType.set(phase);
        effect(() => {
            const d = this.draft();
            const phase = this.phaseType();
            const syncedPhase = this.hasSyncedPhaseFromDraft();
            if (syncedPhase === phase) return;
            const phaseData = phase === 'warmup' ? d.warmup : d.cooldown;
            const movements = phaseData?.movements;
            if (movements?.length) {
                this.hasSyncedPhaseFromDraft.set(phase);
                untracked(() => {
                    this.phaseItems.set(
                        movements.map((m) => ({
                            exercise: {
                                exerciseId: m.exerciseId,
                                name: this.formatIdAsDisplayName(m.exerciseId),
                                images: [],
                                targetMuscles: [],
                                bodyParts: [],
                                equipments: [],
                                secondaryMuscles: [],
                                instructions: []
                            } as Exercise,
                            durationSeconds: m.durationSeconds ?? 60
                        }))
                    );
                });
            }
        });
        effect(() => {
            const items = this.phaseItems();
            const ids = [...new Set(items.map((p) => p.exercise.exerciseId).filter(Boolean))];
            if (ids.length > 0) {
                this.exercisesFacade.loadExercisesMap(ids);
            }
        });
        effect(() => {
            const items = this.phaseItems();
            const phase = this.phaseType();
            const canPushToDraft = this.facade.workout() === null || this.hasSyncedPhaseFromDraft() === phase;
            if (canPushToDraft) {
                const movements = items.map((p) => ({
                    exerciseId: p.exercise.exerciseId,
                    durationSeconds: p.durationSeconds ?? 0
                }));
                const totalDurationSeconds = items.reduce((sum, p) => sum + (p.durationSeconds ?? 0), 0);
                const phaseData: Phase = { totalDurationSeconds, movements };
                untracked(() => {
                    this.facade.updateDraft(phase === 'warmup' ? { warmup: phaseData } : { cooldown: phaseData });
                });
            }
        });
    }

    readonly workoutId = signal<string | null>(null);
    readonly isEditMode = signal(false);
    readonly phaseType = signal<WorkoutPhaseType>('warmup');

    readonly phaseItems = signal<PhaseExerciseItem[]>([]);
    readonly durationModalOpen = signal(false);
    readonly durationModalItemIndex = signal<number | null>(null);
    readonly durationInputSeconds = signal<number>(60);

    readonly pageTitle = computed(() => {
        const phase = this.phaseType();
        const cap = phase === 'warmup' ? 'Warmup' : 'Cooldown';
        return this.isEditMode() ? `Edit ${cap}` : cap;
    });

    readonly draft = this.facade.workoutDraft;
    readonly isSaving = this.facade.isSaving;

    readonly backHref = computed(() => {
        const id = this.workoutId();
        const phase = this.phaseType();
        if (this.isEditMode() && id) {
            return phase === 'cooldown' ? `/tabs/workouts/edit/${id}/main-workout` : `/tabs/workouts/edit/${id}/info`;
        }
        return phase === 'cooldown' ? '/tabs/workouts/create/main-workout' : '/tabs/workouts/create/info';
    });

    readonly allHaveDuration = computed(() => {
        const items = this.phaseItems();
        return items.length > 0 && items.every((p) => p.durationSeconds != null && p.durationSeconds > 0);
    });

    readonly totalDurationSeconds = computed(() => this.phaseItems().reduce((sum, p) => sum + (p.durationSeconds ?? 0), 0));

    readonly nextButtonLabel = computed(() => (this.phaseType() === 'cooldown' ? 'Finish' : 'Next'));

    readonly editingItem = computed(() => {
        const idx = this.durationModalItemIndex();
        const items = this.phaseItems();
        return idx != null && idx >= 0 && idx < items.length ? items[idx] : null;
    });

    readonly durationModalExerciseName = computed(() => {
        const item = this.editingItem();
        return item?.exercise ? this.getExerciseName(item.exercise.exerciseId) : null;
    });

    ngOnInit(): void {
        const path = this.route.snapshot.routeConfig?.path ?? '';
        const phase = path.endsWith('cooldown') ? 'cooldown' : 'warmup';
        this.phaseType.set(phase);
        const id = this.route.snapshot.paramMap.get('workoutId');
        if (id) {
            this.workoutId.set(id);
            this.isEditMode.set(true);
            const existing = this.facade.workout();
            if (existing?.id !== id) {
                this.facade.loadWorkout(id);
            }
        }
    }

    async onCancel(): Promise<void> {
        const stay = await this.cancelService.confirmCancel();
        if (!stay) {
            this.router.navigate(['/tabs/workouts']);
        }
    }

    navigateBack(): void {
        this.router.navigateByUrl(this.backHref());
    }

    onNext(): void {
        if (!this.allHaveDuration()) return;
        const phase = this.phaseType();
        if (phase === 'warmup') {
            const id = this.workoutId();
            if (this.isEditMode() && id) {
                this.router.navigate(['/tabs/workouts/edit', id, 'main-workout']);
            } else {
                this.router.navigate(['/tabs/workouts/create/main-workout']);
            }
        } else {
            this.workoutSubmitService.submitWorkout().subscribe({
                next: () => this.router.navigate(['/tabs/workouts']),
                error: () => {
                    /* Error is reflected in facade.error(); navigation is skipped. */
                }
            });
        }
    }

    onExerciseSelected(exercises: Exercise[]): void {
        const existingIds = new Set(this.phaseItems().map((p) => p.exercise.exerciseId));
        const toAdd = exercises.filter((ex) => !existingIds.has(ex.exerciseId)).map((ex) => ({ exercise: ex, durationSeconds: 60 }));
        this.phaseItems.update((prev) => [...prev, ...toAdd]);
    }

    onExerciseCancelled(): void {
        // No-op: keep current phase items
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

    closeExerciseDetailsModal(): void {
        // No-op when using ModalController; modal dismisses itself
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

    private formatIdAsDisplayName(id: string): string {
        if (!id) return id;
        return id
            .replace(/[-_]/g, ' ')
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    getExerciseName(exerciseId: string): string {
        return this.exercisesFacade.exercisesMap()[exerciseId]?.name ?? this.formatIdAsDisplayName(exerciseId);
    }

    getExerciseImage(exerciseId: string): string {
        const images = this.exercisesFacade.exercisesMap()[exerciseId]?.images;
        return images?.length ? images[0] : '';
    }
}
