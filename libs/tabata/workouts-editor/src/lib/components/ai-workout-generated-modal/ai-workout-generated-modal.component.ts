import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeOutline } from 'ionicons/icons';

@Component({
    selector: 'tbt-ai-workout-generated-modal',
    templateUrl: './ai-workout-generated-modal.component.html',
    styleUrls: ['./ai-workout-generated-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon]
})
export class AiWorkoutGeneratedModalComponent {
    private readonly modalCtrl = inject(ModalController);

    constructor() {
        addIcons({ checkmarkCircleOutline, closeOutline });
    }

    onDismiss(): void {
        this.modalCtrl.dismiss(null, 'confirm');
    }
}
