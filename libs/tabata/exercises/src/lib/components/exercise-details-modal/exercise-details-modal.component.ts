import { Component, ChangeDetectionStrategy, effect, inject, input, OnDestroy } from '@angular/core';
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
    IonItem,
    IonSpinner
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bodyOutline, barbellOutline, fitnessOutline, listOutline } from 'ionicons/icons';
import { ExercisesFacade } from '@silver/tabata/states/exercises';

@Component({
    selector: 'tbt-exercise-details-modal',
    templateUrl: './exercise-details-modal.component.html',
    styleUrl: './exercise-details-modal.component.scss',
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
        IonItem,
        IonSpinner
    ]
})
export class ExerciseDetailsModalComponent implements OnDestroy {
    private readonly modalCtrl = inject(ModalController);
    private readonly facade = inject(ExercisesFacade);

    readonly exerciseId = input<string>('');

    readonly exercise = this.facade.selectedExercise;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    constructor() {
        addIcons({ bodyOutline, barbellOutline, fitnessOutline, listOutline });
        effect(() => {
            const id = this.exerciseId();
            if (id) {
                this.facade.getExerciseById(id);
            }
        });
    }

    ngOnDestroy(): void {
        this.facade.clearSelectedExercise();
    }

    onClose(): void {
        this.modalCtrl.dismiss();
    }

    formatMuscle(muscle: string): string {
        return muscle
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
