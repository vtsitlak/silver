import { Component, inject } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AuthStore } from "@silver/tabata/auth";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  protected readonly authStore = inject(AuthStore);

  constructor() {
    this.authStore.getUser();
  }
}
