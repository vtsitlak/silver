import { Routes } from '@angular/router';
import { VehiclesComponent } from './vehicles/vehicles/vehicles.component';

// Standalone routing configuration for the application.
export const appRoutes: Routes = [
  {
    path: 'vehicles',
    component: VehiclesComponent,
  },
  {
    path: '',
    redirectTo: '/vehicles',
    pathMatch: 'full',
  }
];
