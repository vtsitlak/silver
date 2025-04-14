import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';


@Component({
  selector: 'tbt-history',
  templateUrl: 'history.component.html',
  styleUrls: ['history.component.scss'],
  standalone: true,
  imports: [IonHeader, IonContent, ToolbarComponent],
})
export class HistoryComponent {
}
