import { Routes } from '@angular/router';
import { TabsComponent } from '@silver/tabata/ui';

export const routes: Routes = [
    {
        path: '',
        component: TabsComponent,
        children: [
            {
                path: 'home',
                loadComponent: () => import('@silver/tabata/home').then((m) => m.HomeComponent)
            },
            {
                path: 'workouts',
                loadComponent: () => import('@silver/tabata/tabata-workouts').then((m) => m.WorkoutsComponent)
            },
            {
                path: 'workouts/create',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutEditorComponent)
            },
            {
                path: 'workouts/edit/:workoutId',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutEditorComponent)
            },
            {
                path: 'history',
                loadComponent: () => import('@silver/tabata/history').then((m) => m.HistoryComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('@silver/tabata/profile').then((m) => m.ProfileComponent)
            },
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
];
