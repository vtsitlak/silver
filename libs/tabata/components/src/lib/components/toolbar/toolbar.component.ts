import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@silver/tabata/authentication';
import { addIcons } from 'ionicons';
import { logOut } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'tbt-toolbar',
  imports: [CommonModule, IonicModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: true,
})
export class ToolbarComponent {
  constructor() {
    addIcons({ logOut });
  }
  title = input<string | null>(null);
  authService = inject(AuthService);
  router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
