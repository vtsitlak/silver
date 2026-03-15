import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'tbt-auth-info-modal',
    standalone: true,
    imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
    templateUrl: './auth-info-modal.component.html',
    styleUrl: './auth-info-modal.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AuthInfoModalComponent {
    readonly isOpen = input.required<boolean>();
    readonly closed = output<void>();

    onClose(): void {
        this.closed.emit();
    }

    onDidDismiss(): void {
        this.closed.emit();
    }
}
