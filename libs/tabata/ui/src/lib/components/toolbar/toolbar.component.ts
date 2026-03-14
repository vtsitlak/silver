import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPopover, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { addIcons } from 'ionicons';
import { logOut, home, person, menu } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
@Component({
    selector: 'tbt-toolbar',
    imports: [IonButtons, IonContent, IonPopover, IonTitle, IonToolbar, IonIcon, IonLabel, IonItem, IonList, IonButton, IonHeader, RouterLink],
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
    router = inject(Router);
    private readonly authFacade = inject(AuthFacade);

    showPopover = false;
    popoverEvent: unknown;

    constructor() {
        addIcons({ home, menu, person, logOut });
    }

    togglePopover(event: Event) {
        this.popoverEvent = event;
        this.showPopover = !this.showPopover;
    }

    closePopover() {
        this.showPopover = false;
    }

    onMenuItemClick() {
        this.closePopover();
    }

    logout() {
        this.closePopover();
        this.authFacade.logout();
    }
}
