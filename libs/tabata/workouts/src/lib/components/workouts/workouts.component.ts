import { Component } from '@angular/core';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';


@Component({
  selector: 'tbt-workouts',
  templateUrl: 'workouts.component.html',
  styleUrls: ['workouts.component.scss'],
  standalone: true,
  imports: [IonHeader, ToolbarComponent, IonContent ],
})
export class WorkoutsComponent {

}
