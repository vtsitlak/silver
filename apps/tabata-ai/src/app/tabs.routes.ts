import { Routes } from '@angular/router';
import { TabsComponent } from '@silver/tabata/ui';
import { workoutEditorCanDeactivateGuard } from './guards/workout-editor-can-deactivate.lazy-guard';

export const routes: Routes = [
    {
        path: '',
        component: TabsComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('@silver/tabata/dashboard').then((m) => m.DashboardComponent)
            },
            {
                path: 'workouts',
                loadComponent: () => import('@silver/tabata/workouts').then((m) => m.WorkoutsComponent)
            },
            {
                path: 'workout-editor/create',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutEditorComponent),
                canDeactivate: [workoutEditorCanDeactivateGuard]
            },
            {
                path: 'workout-editor/:workoutId',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutEditorComponent),
                canDeactivate: [workoutEditorCanDeactivateGuard]
            },
            {
                path: 'workouts/:workoutId',
                loadComponent: () => import('@silver/tabata/workouts').then((m) => m.WorkoutDetailsComponent)
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
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
