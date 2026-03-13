import { Component, ChangeDetectionStrategy, inject, input, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonContent,
    IonHeader,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonBackButton,
    IonButtons,
    IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline } from 'ionicons/icons';
import { WorkoutsFacade, TabataWorkout } from '@silver/tabata/states/workouts';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { formatDurationMinutes, getBlockDurationMinutes, formatSecondsToMinutes } from '@silver/tabata/helpers';
import { ToolbarComponent } from '@silver/tabata/ui';

@Component({
    selector: 'tbt-workout-details',
    templateUrl: 'workout-details.component.html',
    styleUrls: ['workout-details.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ToolbarComponent,
        IonHeader,
        IonBackButton,
        IonButtons,
        IonContent,
        IonButton,
        IonIcon,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonChip,
        IonNote
    ]
})
export class WorkoutDetailsComponent implements OnInit {
    private readonly facade = inject(WorkoutsFacade);
    private readonly router = inject(Router);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly exercisesFacade = inject(ExercisesFacade);

    readonly workoutId = input.required<string>();

    /** Use the facade's loaded workout signal (set when loadWorkoutById completes). */
    readonly workout = this.facade.loadedWorkout;

    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    constructor() {
        addIcons({ playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline });

        effect(() => {
            const id = this.workoutId();
            if (id) {
                this.facade.loadWorkoutById(id);
            }
        });

        effect(() => {
            const w = this.workout();
            if (!w) return;
            const ids = [
                ...new Set([
                    ...w.blocks.map((b) => b.exerciseId),
                    ...(w.warmup?.movements?.map((m) => m.exerciseId) ?? []),
                    ...(w.cooldown?.movements?.map((m) => m.exerciseId) ?? [])
                ])
            ].filter(Boolean);
            if (ids.length > 0) {
                this.exercisesFacade.loadExercisesMap(ids);
            }
        });
    }

    ngOnInit(): void {
        if (this.facade.workouts().length === 0) {
            this.facade.loadWorkouts();
        }
    }

    editWorkout(): void {
        const w = this.workout();
        if (w) {
            this.workoutEditorFacade.setWorkout(w);
            this.router.navigate(['/tabs/workouts/edit', w.id, 'info']);
        }
    }

    startWorkout(): void {
        // TODO: Implement workout player navigation
        console.log('Starting workout:', this.workoutId());
    }

    /** Expose helpers for template (duration/block formatting). */
    readonly formatDurationMinutes = formatDurationMinutes;
    readonly getBlockDurationMinutes = getBlockDurationMinutes;
    readonly formatSecondsToMinutes = formatSecondsToMinutes;

    /** Resolve exercise id to display name (from exercisesMap, or id as fallback). */
    getExerciseName(exerciseId: string): string {
        return this.exercisesFacade.exercisesMap()[exerciseId]?.name ?? exerciseId;
    }

    /** Resolve exercise id to first image URL for thumbnail (empty string if none). */
    getExerciseImage(exerciseId: string): string {
        const images = this.exercisesFacade.exercisesMap()[exerciseId]?.images;
        return images?.length ? images[0] : '';
    }
}
