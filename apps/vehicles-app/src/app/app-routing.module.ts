import { Routes } from '@angular/router';
import { VehiclesComponent } from '@silver/vehicles-ui';

// Standalone routing configuration for the application.
export const appRoutes: Routes = [
    {
        path: 'vehicles',
        component: VehiclesComponent
    },
    {
        path: '',
        redirectTo: '/vehicles',
        pathMatch: 'full'
    }
];
