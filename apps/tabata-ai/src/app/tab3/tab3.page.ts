import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/components';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonHeader, IonContent, ToolbarComponent],
})
export class Tab3Page {
  constructor() {}
}
