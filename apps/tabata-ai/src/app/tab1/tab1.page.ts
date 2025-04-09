import { Component } from '@angular/core';
import {
  IonHeader,
  IonContent,
} from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    ToolbarComponent
  ],
})
export class Tab1Page {
  constructor() {}
}
