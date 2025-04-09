import { Component, inject, input, AfterViewChecked } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { AuthStore } from "@silver/tabata/auth";
import { addIcons } from "ionicons";
import { logOut, home, person, menu } from "ionicons/icons";
import { Router, RouterLink } from "@angular/router";
@Component({
  selector: "tbt-toolbar",
  imports: [
    CommonModule,
    IonButtons,
    IonContent,
    IonPopover,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonLabel,
    IonItem,
    IonList,
    IonButton,
    IonHeader,
    RouterLink,
  ],
  templateUrl: "./toolbar.component.html",
  styleUrl: "./toolbar.component.scss",
  standalone: true,
})
export class ToolbarComponent implements AfterViewChecked {

  constructor() {
    addIcons({ home, menu, person, logOut });
  }

  title = input<string | null>(null);
  router = inject(Router);
  private readonly authStore = inject(AuthStore);
   // Track whether popover is open or not
   showPopover = false;

   // Toggle popover visibility
   togglePopover(event: Event): void {
    event.stopPropagation(); // Prevent click event propagation to avoid closing the popover when clicking inside
    this.showPopover = !this.showPopover;
  }

    // Action after clicking on the menu item
    onMenuItemClick(): void {
      this.closePopover(); // Close popover after menu item is clicked
    }

  // Close the popover after it is dismissed
  closePopover(): void {
    this.showPopover = false;
  }

  logout(): void {
    this.authStore.logout();
    this.closePopover();
  }

    // Ensure popover position recalculates after it's shown again
    ngAfterViewChecked(): void {
      if (this.showPopover) {
        // Manually trigger popover position recalculation
        const popover = document.querySelector('ion-popover');
        if (popover) {
          popover.style.position = 'absolute'; // Reset the position property
        }
      }
    }
}
