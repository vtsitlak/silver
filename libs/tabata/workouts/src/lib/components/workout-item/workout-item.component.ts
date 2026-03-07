import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, timeOutline, fitnessOutline } from 'ionicons/icons';
import { TabataWorkout } from '@silver/tabata/states/workouts';

@Component({
    selector: 'tbt-workout-item',
    templateUrl: 'workout-item.component.html',
    styleUrls: ['workout-item.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonItem, IonLabel, IonIcon]
})
export class WorkoutItemComponent {
    readonly workout = input.required<TabataWorkout>();
    readonly workoutClick = output<TabataWorkout>();

    constructor() {
        addIcons({ chevronForward, timeOutline, fitnessOutline });
    }

    onClick(): void {
        this.workoutClick.emit(this.workout());
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
