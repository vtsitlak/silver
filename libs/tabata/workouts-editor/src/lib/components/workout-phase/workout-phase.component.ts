import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonContent, IonFooter, IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { ToolbarComponent, DurationInputModalComponent } from '@silver/tabata/ui';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
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
    standalone: true,
    imports: [
        IonHeader,
        IonContent,
        IonFooter,
        IonButton,
        IonButtons,
        IonBackButton,
        IonLabel,
        IonItem,
        IonList,
        IonIcon,
        ToolbarComponent,
        DurationInputModalComponent
    ]
})
export class WorkoutPhaseComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly modalCtrl = inject(ModalController);

    constructor() {
        addIcons({ createOutline, trashOutline });
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

    readonly backHref = computed(() => {
        const id = this.workoutId();
        if (this.isEditMode() && id) {
            return `/tabs/workouts/edit/${id}/info`;
        }
        return '/tabs/workouts/create/info';
    });

    readonly allHaveDuration = computed(() => {
        const items = this.phaseItems();
        return items.length > 0 && items.every((p) => p.durationSeconds != null && p.durationSeconds > 0);
    });

    readonly totalDurationSeconds = computed(() => this.phaseItems().reduce((sum, p) => sum + (p.durationSeconds ?? 0), 0));

    readonly editingItem = computed(() => {
        const idx = this.durationModalItemIndex();
        const items = this.phaseItems();
        return idx != null && idx >= 0 && idx < items.length ? items[idx] : null;
    });

    readonly durationModalExerciseName = computed(() => {
        const item = this.editingItem();
        return item?.exercise ? this.formatName(item.exercise.name) : null;
    });

    ngOnInit(): void {
        const path = this.route.snapshot.routeConfig?.path ?? '';
        const phase = path.endsWith('cooldown') ? 'cooldown' : 'warmup';
        this.phaseType.set(phase);
        const id = this.route.snapshot.paramMap.get('workoutId');
        if (id) {
            this.workoutId.set(id);
            this.isEditMode.set(true);
            this.facade.loadWorkout(id);
        }
    }

    onCancel(): void {
        this.router.navigate(['/tabs/workouts']);
    }

    onNext(): void {
        if (!this.allHaveDuration()) return;
        const phase = this.phaseType();
        const items = this.phaseItems();
        const movements = items.map((p) => ({
            exerciseId: p.exercise.exerciseId,
            durationSeconds: p.durationSeconds ?? 0
        }));
        const totalDurationSeconds = this.totalDurationSeconds();
        const phaseData: Phase = { totalDurationSeconds, movements };
        if (phase === 'warmup') {
            this.facade.updateDraft({ warmup: phaseData });
        } else {
            this.facade.updateDraft({ cooldown: phaseData });
        }
        const id = this.workoutId();
        if (this.isEditMode() && id) {
            if (phase === 'warmup') {
                this.router.navigate(['/tabs/workouts/edit', id, 'cooldown']);
            } else {
                this.router.navigate(['/tabs/workouts']);
            }
        } else {
            if (phase === 'warmup') {
                this.router.navigate(['/tabs/workouts/create/cooldown']);
            } else {
                this.router.navigate(['/tabs/workouts']);
            }
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

    formatName(name: string): string {
        return name
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }
}
