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
                loadComponent: () => import('@silver/tabata/workouts').then((m) => m.WorkoutsComponent)
            },
            {
                path: 'workouts/create/info',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutInfoComponent)
            },
            {
                path: 'workouts/create/warmup',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutPhaseComponent)
            },
            {
                path: 'workouts/create/main-workout',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.MainWorkoutComponent)
            },
            {
                path: 'workouts/create/cooldown',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutPhaseComponent)
            },
            {
                path: 'workouts/create',
                redirectTo: 'workouts/create/info',
                pathMatch: 'full'
            },
            {
                path: 'workouts/edit/:workoutId/info',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutInfoComponent)
            },
            {
                path: 'workouts/edit/:workoutId/warmup',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutPhaseComponent)
            },
            {
                path: 'workouts/edit/:workoutId/main-workout',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.MainWorkoutComponent)
            },
            {
                path: 'workouts/edit/:workoutId/cooldown',
                loadComponent: () => import('@silver/tabata/workouts-editor').then((m) => m.WorkoutPhaseComponent)
            },
            {
                path: 'workouts/edit/:workoutId',
                redirectTo: 'workouts/edit/:workoutId/info',
                pathMatch: 'full'
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
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
];
