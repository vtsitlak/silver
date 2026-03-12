import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonIcon,
    IonList,
    IonItem
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, createOutline, timeOutline, fitnessOutline, flashOutline, pauseOutline, closeOutline } from 'ionicons/icons';
import type { TabataWorkout, TabataBlock } from '@silver/tabata/states/workouts';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';

@Component({
    selector: 'tbt-workout-details-modal',
    templateUrl: './workout-details-modal.component.html',
    styleUrl: './workout-details-modal.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonChip,
        IonLabel,
        IonIcon,
        IonList,
        IonItem
    ]
})
export class WorkoutDetailsModalComponent {
    private readonly modalCtrl = inject(ModalController);
    private readonly router = inject(Router);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);

    readonly workout = input.required<TabataWorkout>();

    constructor() {
        addIcons({
            playCircle,
            createOutline,
            timeOutline,
            fitnessOutline,
            flashOutline,
            pauseOutline,
            closeOutline
        });
    }

    onClose(): void {
        this.modalCtrl.dismiss();
    }

    onEdit(): void {
        const w = this.workout();
        this.workoutEditorFacade.setWorkout(w);
        this.modalCtrl.dismiss().then(() => {
            this.router.navigate(['/tabs/workouts/edit', w.id, 'info']);
        });
    }

    onPlay(): void {
        const w = this.workout();
        this.modalCtrl.dismiss().then(() => {
            this.router.navigate(['/tabs/workouts', w.id]);
        });
    }

    formatDuration(minutes: number): string {
        if (minutes < 60) return `${minutes} min`;
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
