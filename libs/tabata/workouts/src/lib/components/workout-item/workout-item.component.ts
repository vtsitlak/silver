import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonItem, IonLabel, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, timeOutline, fitnessOutline, createOutline, playCircle, trashOutline } from 'ionicons/icons';
import { TabataWorkout } from '@silver/tabata/states/workouts';

@Component({
    selector: 'tbt-workout-item',
    templateUrl: 'workout-item.component.html',
    styleUrls: ['workout-item.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonItem, IonLabel, IonIcon, IonButton, IonButtons]
})
export class WorkoutItemComponent {
    readonly workout = input.required<TabataWorkout>();
    readonly detailsClick = output<TabataWorkout>();
    readonly editClick = output<TabataWorkout>();
    readonly playClick = output<TabataWorkout>();
    readonly removeClick = output<TabataWorkout>();

    constructor() {
        addIcons({ chevronForward, timeOutline, fitnessOutline, createOutline, playCircle, trashOutline });
    }

    onDetailsClick(): void {
        this.detailsClick.emit(this.workout());
    }

    onEditClick(event: Event): void {
        event.stopPropagation();
        this.editClick.emit(this.workout());
    }

    onPlayClick(event: Event): void {
        event.stopPropagation();
        this.playClick.emit(this.workout());
    }

    onRemoveClick(event: Event): void {
        event.stopPropagation();
        this.removeClick.emit(this.workout());
    }

    get blocksCount(): number {
        return this.workout().blocks?.length ?? 0;
    }

    get formattedDuration(): string {
        const minutes = this.workout().totalDurationMinutes;
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
}
