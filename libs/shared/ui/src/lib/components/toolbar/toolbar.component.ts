import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'ui-toolbar',
  imports: [CommonModule, IonicModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: true
})
export class UiToolbarComponent {}
