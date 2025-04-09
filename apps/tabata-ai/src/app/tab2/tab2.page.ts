import { Component } from '@angular/core';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonHeader, ToolbarComponent, IonContent],
})
export class Tab2Page {
  constructor() {}
}
