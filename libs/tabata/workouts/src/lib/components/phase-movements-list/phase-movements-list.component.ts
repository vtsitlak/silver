import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import type { ExerciseItem } from '@silver/tabata/states/workouts';

@Component({
    selector: 'tbt-phase-movements-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonList, IonItem, IonLabel],
    templateUrl: './phase-movements-list.component.html',
    styleUrls: ['./phase-movements-list.component.scss']
})
export class PhaseMovementsListComponent {
    readonly movements = input.required<ExerciseItem[]>();
    readonly getExerciseName = input.required<(exerciseId: string) => string>();
    readonly getExerciseImage = input.required<(exerciseId: string) => string>();
}
