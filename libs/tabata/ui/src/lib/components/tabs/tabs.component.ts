import { Component, EnvironmentInjector, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { speedometerOutline, barbell, calendar } from 'ionicons/icons';

@Component({
    selector: 'tbt-tabs',
    templateUrl: 'tabs.component.html',
    styleUrls: ['tabs.component.scss'],
    imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink]
})
export class TabsComponent {
    public environmentInjector = inject(EnvironmentInjector);

    constructor() {
        addIcons({ speedometerOutline, barbell, calendar });
    }
}
