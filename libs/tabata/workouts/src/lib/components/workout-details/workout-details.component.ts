import { Component, ChangeDetectionStrategy, inject, input, effect } from '@angular/core';
import { Location } from '@angular/common';
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
    IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline, heart, heartOutline, chevronBackOutline } from 'ionicons/icons';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import type { UserWorkoutItem } from '@silver/tabata/states/user-workouts';
import { computed } from '@angular/core';
import { formatDurationMinutes, getBlockDurationMinutes, formatSecondsToMinutes } from '@silver/tabata/helpers';
import { ToolbarComponent } from '@silver/tabata/ui';
import { PhaseMovementsListComponent } from '../phase-movements-list/phase-movements-list.component';

@Component({
    selector: 'tbt-workout-details',
    templateUrl: 'workout-details.component.html',
    styleUrls: ['workout-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ToolbarComponent,
        PhaseMovementsListComponent,
        IonHeader,
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
        IonChip
    ]
})
export class WorkoutDetailsComponent {
    private readonly facade = inject(WorkoutsFacade);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly authFacade = inject(AuthFacade);
    private readonly userWorkoutsFacade = inject(UserWorkoutsFacade);

    readonly workoutId = input.required<string>();

    /** Use the facade's loaded workout signal (set when loadWorkoutById completes). */
    readonly workout = this.facade.loadedWorkout;

    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    readonly isFavorite = computed(() => {
        const id = this.workoutId();
        const favs = this.userWorkoutsFacade.userWorkout()?.favoriteWorkouts ?? [];
        return id ? favs.includes(id) : false;
    });

    constructor() {
        addIcons({ playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline, heart, heartOutline, chevronBackOutline });

        effect(() => {
            const id = this.workoutId();
            if (id) {
                this.facade.loadWorkoutById(id);
            }
        });

        effect(() => {
            const uid = this.authFacade.user()?.uid;
            if (uid) {
                this.userWorkoutsFacade.getOrCreateUserWorkout(uid);
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

    goBack(): void {
        this.location.back();
    }

    editWorkout(): void {
        const w = this.workout();
        if (w) {
            this.workoutEditorFacade.setWorkout(w);
            this.router.navigate(['/tabs/workouts/edit', w.id, 'info']);
        }
    }

    startWorkout(): void {
        const id = this.workoutId();
        if (id) {
            this.router.navigate(['/workouts', id, 'play']);
        }
    }

    toggleFavorite(): void {
        const id = this.workoutId();
        const userId = this.authFacade.user()?.uid;
        if (!id || !userId) return;

        const current = this.userWorkoutsFacade.userWorkout();
        const base = current?.userId === userId ? current : { userId, favoriteWorkouts: [] as string[], workoutItems: [] as UserWorkoutItem[] };
        const favs = base.favoriteWorkouts ?? [];
        const isFav = favs.includes(id);
        const newFavs = isFav ? favs.filter((f) => f !== id) : [...favs, id];
        this.userWorkoutsFacade.saveUserWorkout({ ...base, favoriteWorkouts: newFavs });
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

    /** Bound for passing to tbt-phase-movements-list. */
    readonly getExerciseNameFn = (exerciseId: string): string => this.getExerciseName(exerciseId);
    /** Bound for passing to tbt-phase-movements-list. */
    readonly getExerciseImageFn = (exerciseId: string): string => this.getExerciseImage(exerciseId);
}
