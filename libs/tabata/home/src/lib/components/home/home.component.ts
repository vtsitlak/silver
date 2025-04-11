import { Component } from "@angular/core";
import { IonHeader, IonContent } from "@ionic/angular/standalone";
import { ToolbarComponent } from "@silver/tabata/ui";

@Component({
  selector: "tbt-home",
  templateUrl: "home.component.html",
  styleUrls: ["home.component.scss"],
  standalone: true,
  imports: [IonHeader, IonContent, ToolbarComponent],
})
export class HomeComponent {}
