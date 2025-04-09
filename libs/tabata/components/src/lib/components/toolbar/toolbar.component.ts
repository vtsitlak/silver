import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '@ionic/angular/standalone';
import {  AuthStore } from '@silver/tabata/auth';
import { addIcons } from 'ionicons';
import { logOut, home, person, menu } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'tbt-toolbar',
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
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: true,
})
export class ToolbarComponent {
  constructor() {
    addIcons({ home, menu, person, logOut });
  }
  title = input<string | null>(null);

  router = inject(Router);
  private readonly authStore = inject(AuthStore);

  logout(): void {
    this.authStore.logout();
  }
}
