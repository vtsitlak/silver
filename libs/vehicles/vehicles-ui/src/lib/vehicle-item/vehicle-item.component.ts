import { Component, computed, input } from '@angular/core';
import { Vehicle } from '@silver/vehicles-store';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
    selector: 'app-vehicle-item',
    standalone: true,
    templateUrl: './vehicle-item.component.html',
    styleUrls: ['./vehicle-item.component.scss'],
    imports: [MatGridListModule]
})
export class VehicleItemComponent {

  vehicle = input.required<Vehicle>();

  brand =  computed(() => this.vehicle().brand);
  type =  computed(() => this.vehicle().type);
  colors =  computed(() => this.vehicle().colors);
  img =  computed(() => this.vehicle().img);
}
