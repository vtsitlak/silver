import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'ui-toolbar',
  imports: [CommonModule, IonicModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: true
})
export class UiToolbarComponent {
  title = input<string | null>(null);
  menuOptions = input<string[] | null>([]);
  logoIcon = input<string | null>(null);
}
