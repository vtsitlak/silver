import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@tabata/authentication';
import { addIcons } from 'ionicons';
import { logOut } from 'ionicons/icons';

@Component({
  selector: 'tbt-toolbar',
  imports: [CommonModule, IonicModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: true
})
export class ToolbarComponent {
  constructor() {
    addIcons({ logOut });
  }
  title = input<string | null>(null);
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout().subscribe();
  }
}
