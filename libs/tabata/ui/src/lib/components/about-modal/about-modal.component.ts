import { Component, inject, signal, type WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

type TabValue = 'overview' | 'how-to-use';

@Component({
    selector: 'tbt-about-modal',
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSegment, IonSegmentButton, IonLabel],
    templateUrl: './about-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './about-modal.component.scss'
})
export class AboutModalComponent {
    private readonly modalCtrl = inject(ModalController);

    readonly selectedTab: WritableSignal<TabValue> = signal<TabValue>('overview');

    onClose(): void {
        this.modalCtrl.dismiss();
    }

    onTabChange(value: string): void {
        if (value === 'overview' || value === 'how-to-use') {
            this.selectedTab.set(value);
        }
    }
}
