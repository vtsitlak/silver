import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

@Component({
    selector: 'tbt-about-modal',
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
    templateUrl: './about-modal.component.html',
    styleUrl: './about-modal.component.scss'
})
export class AboutModalComponent {
    private readonly modalCtrl = inject(ModalController);

    onClose(): void {
        this.modalCtrl.dismiss();
    }
}
