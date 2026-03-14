import { Component, ChangeDetectionStrategy, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, pause, close, playSkipForward, timeOutline, checkmarkCircle } from 'ionicons/icons';
import { WorkoutsFacade, TabataWorkout } from '@silver/tabata/states/workouts';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';
import { ToastService } from '@silver/tabata/helpers';
import { ActionSheetController } from '@ionic/angular/standalone';

type PhaseType = 'warmup' | 'main' | 'cooldown';

interface WorkoutSegment {
    phase: PhaseType;
    label: string;
    durationSeconds: number;
    exerciseId: string | null;
    isRest: boolean;
}

@Component({
    selector: 'tbt-workout-player',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
    templateUrl: './workout-player.component.html',
    styleUrl: './workout-player.component.css'
})
export class WorkoutPlayerComponent implements OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly toast = inject(ToastService);
    private readonly actionSheetCtrl = inject(ActionSheetController);

    private timerId: number | null = null;

    readonly workoutId = signal<string | null>(null);
    readonly workout = this.workoutsFacade.loadedWorkout;
    readonly isLoading = this.workoutsFacade.isLoading;
    readonly error = this.workoutsFacade.error;

    readonly segments = signal<WorkoutSegment[]>([]);
    readonly currentIndex = signal(0);
    readonly remainingInSegment = signal(0);
    readonly isPlaying = signal(false);
    readonly finished = signal(false);
    /** True once the user has pressed Play at least once; Skip is disabled until then. */
    readonly hasStarted = signal(false);

    readonly currentSegment = computed(() => this.segments()[this.currentIndex()] ?? null);

    readonly totalDurationSeconds = computed(() => this.segments().reduce((acc, seg) => acc + seg.durationSeconds, 0));

    readonly remainingTotalSeconds = computed(() => {
        const segs = this.segments();
        const idx = this.currentIndex();
        if (segs.length === 0) return 0;
        const remainingCurrent = this.remainingInSegment();
        const remainingFuture = segs.slice(idx + 1).reduce((acc, seg) => acc + seg.durationSeconds, 0);
        return remainingCurrent + remainingFuture;
    });

    readonly currentExercise = computed<Exercise | null>(() => {
        const seg = this.currentSegment();
        if (!seg || !seg.exerciseId) return null;
        return this.exercisesFacade.exercisesMap()[seg.exerciseId] ?? null;
    });

    constructor() {
        addIcons({ play, pause, close, playSkipForward, timeOutline, checkmarkCircle });

        const id = this.route.snapshot.paramMap.get('workoutId');
        if (!id) {
            this.toast.showError('Workout not found');
            this.router.navigate(['/tabs/workouts']);
            return;
        }
        this.workoutId.set(id);
        this.workoutsFacade.loadWorkoutById(id);

        effect(() => {
            const w = this.workout();
            if (!w) return;
            this.buildSegments(w);
            this.loadExercisesForWorkout(w);
        });

        effect(() => {
            const playing = this.isPlaying();
            const seg = this.currentSegment();
            if (!playing || !seg || this.finished()) {
                this.clearTimer();
                return;
            }
            if (this.remainingInSegment() <= 0) {
                this.remainingInSegment.set(seg.durationSeconds);
            }
            this.startTimer();
        });
    }

    ngOnDestroy(): void {
        this.clearTimer();
    }

    private buildSegments(workout: TabataWorkout): void {
        const result: WorkoutSegment[] = [];

        workout.warmup?.movements?.forEach((m) => {
            result.push({
                phase: 'warmup',
                label: 'Warmup',
                durationSeconds: m.durationSeconds,
                exerciseId: m.exerciseId,
                isRest: false
            });
        });

        workout.blocks.forEach((block, blockIndex) => {
            for (let round = 1; round <= block.rounds; round++) {
                result.push({
                    phase: 'main',
                    label: `Block ${blockIndex + 1} · Round ${round} · Work`,
                    durationSeconds: block.workDurationSeconds,
                    exerciseId: block.exerciseId,
                    isRest: false
                });
                if (round < block.rounds) {
                    result.push({
                        phase: 'main',
                        label: `Block ${blockIndex + 1} · Round ${round} · Rest`,
                        durationSeconds: block.restDurationSeconds,
                        exerciseId: null,
                        isRest: true
                    });
                }
            }
            if (blockIndex < workout.blocks.length - 1 && block.interBlockRestSeconds > 0) {
                result.push({
                    phase: 'main',
                    label: `Rest between blocks`,
                    durationSeconds: block.interBlockRestSeconds,
                    exerciseId: null,
                    isRest: true
                });
            }
        });

        workout.cooldown?.movements?.forEach((m) => {
            result.push({
                phase: 'cooldown',
                label: 'Cooldown',
                durationSeconds: m.durationSeconds,
                exerciseId: m.exerciseId,
                isRest: false
            });
        });

        this.segments.set(result);
        this.currentIndex.set(0);
        this.remainingInSegment.set(result[0]?.durationSeconds ?? 0);
        this.finished.set(false);
    }

    private loadExercisesForWorkout(workout: TabataWorkout): void {
        const ids = [
            ...new Set([
                ...workout.blocks.map((b) => b.exerciseId),
                ...(workout.warmup?.movements?.map((m) => m.exerciseId) ?? []),
                ...(workout.cooldown?.movements?.map((m) => m.exerciseId) ?? [])
            ])
        ].filter(Boolean);
        if (ids.length > 0) {
            this.exercisesFacade.loadExercisesMap(ids);
        }
    }

    private startTimer(): void {
        this.clearTimer();
        this.timerId = window.setInterval(() => {
            const remaining = this.remainingInSegment();
            if (remaining <= 1) {
                this.advanceSegment();
            } else {
                this.remainingInSegment.set(remaining - 1);
            }
        }, 1000);
    }

    private clearTimer(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    togglePlay(): void {
        if (this.finished()) {
            this.restart();
            return;
        }
        const next = !this.isPlaying();
        if (next) {
            this.hasStarted.set(true);
        }
        this.isPlaying.set(next);
    }

    private advanceSegment(): void {
        const nextIndex = this.currentIndex() + 1;
        const segs = this.segments();
        if (nextIndex >= segs.length) {
            this.finished.set(true);
            this.clearTimer();
            this.isPlaying.set(false);
            return;
        }
        this.currentIndex.set(nextIndex);
        this.remainingInSegment.set(segs[nextIndex].durationSeconds);
    }

    skip(): void {
        this.advanceSegment();
    }

    async cancel(): Promise<void> {
        const isPlaying = this.isPlaying();
        if (isPlaying) {
            this.isPlaying.set(false);
        }

        const actionSheet = await this.actionSheetCtrl.create({
            header: 'Cancel workout?',
            buttons: [
                {
                    text: 'Yes, cancel',
                    role: 'destructive',
                    handler: () => {
                        this.clearTimer();
                        this.router.navigate(['/tabs/workouts']);
                    }
                },
                {
                    text: 'Continue workout',
                    role: 'cancel',
                    handler: () => {
                        this.isPlaying.set(isPlaying);
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    restart(): void {
        const segs = this.segments();
        if (segs.length === 0) return;
        this.currentIndex.set(0);
        this.remainingInSegment.set(segs[0].durationSeconds);
        this.finished.set(false);
        this.isPlaying.set(true);
    }

    phaseLabel(seg: WorkoutSegment | null): string {
        if (!seg) return '';
        if (seg.phase === 'warmup') return 'Warmup';
        if (seg.phase === 'cooldown') return 'Cooldown';
        return seg.isRest ? 'Rest' : 'Main';
    }
}
