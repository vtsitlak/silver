import { Component, ChangeDetectionStrategy, inject, input, computed, OnInit } from '@angular/core';
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
    IonToolbar,
    IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline } from 'ionicons/icons';
import { WorkoutsFacade, TabataBlock } from '@silver/tabata/states/workouts';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';

@Component({
    selector: 'tbt-workout-details',
    templateUrl: 'workout-details.component.html',
    styleUrls: ['workout-details.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonBackButton,
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
export class WorkoutDetailsComponent implements OnInit {
    private readonly facade = inject(WorkoutsFacade);
    private readonly router = inject(Router);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);

    readonly workoutId = input.required<string>();

    readonly workout = computed(() => {
        const id = this.workoutId();
        return this.facade.workouts().find((w) => w.id === id) ?? null;
    });

    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    constructor() {
        addIcons({ playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline });
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

    formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    getBlockDuration(block: TabataBlock): number {
        const roundDuration = block.workDurationSeconds + block.restDurationSeconds;
        const totalRoundsDuration = roundDuration * block.rounds;
        return Math.ceil((totalRoundsDuration + block.interBlockRestSeconds) / 60);
    }

    formatSecondsToMinutes(seconds: number): number {
        return Math.ceil(seconds / 60);
    }
}
