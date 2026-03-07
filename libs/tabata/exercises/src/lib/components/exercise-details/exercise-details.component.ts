import { Component, ChangeDetectionStrategy, inject, input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonIcon,
    IonList,
    IonItem,
    IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bodyOutline, barbellOutline, fitnessOutline, listOutline } from 'ionicons/icons';
import { ExercisesFacade } from '@silver/tabata/states/exercises';

@Component({
    selector: 'lib-exercise-details',
    templateUrl: 'exercise-details.component.html',
    styleUrls: ['exercise-details.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonBackButton,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonChip,
        IonLabel,
        IonIcon,
        IonList,
        IonItem,
        IonSpinner
    ]
})
export class ExerciseDetailsComponent implements OnInit, OnDestroy {
    private readonly facade = inject(ExercisesFacade);

    readonly exerciseId = input.required<string>();

    readonly exercise = this.facade.selectedExercise;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    constructor() {
        addIcons({ bodyOutline, barbellOutline, fitnessOutline, listOutline });
    }

    ngOnInit(): void {
        this.facade.getExerciseById(this.exerciseId());
    }

    ngOnDestroy(): void {
        this.facade.clearSelectedExercise();
    }

    formatMuscle(muscle: string): string {
        return muscle
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
