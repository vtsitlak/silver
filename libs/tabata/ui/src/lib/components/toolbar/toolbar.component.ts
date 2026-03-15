import { Component, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { AboutModalComponent } from '../about-modal/about-modal.component';

@Component({
    selector: 'tbt-toolbar',
    imports: [IonButtons, IonTitle, IonToolbar, IonIcon, IonButton, IonHeader],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
    title = input<string | null>(null);
    /** When true, show projected content for start (e.g. back button) instead of the default logo. */
    showStartContent = input<boolean>(false);
    /** When true, show projected content for end (e.g. edit button) instead of the default menu. */
    showEndContent = input<boolean>(false);

    private readonly modalCtrl = inject(ModalController);

    constructor() {
        addIcons({ informationCircleOutline });
    }

    async openAbout(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: AboutModalComponent,
            cssClass: 'about-modal-sheet'
        });
        await modal.present();
    }
}
