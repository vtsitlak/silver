import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['tabs/dashboard']);

export const routes: Routes = [
    { path: '', redirectTo: '/tabs/dashboard', pathMatch: 'full' },
    {
        path: 'workouts/:workoutId/play',
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin },
        loadComponent: () => import('@silver/tabata/workout-player').then((m) => m.WorkoutPlayerComponent)
    },
    {
        path: 'auth',
        loadChildren: () => import('@silver/tabata/auth').then((m) => m.authRoutes),
        data: { authGuardPipe: redirectLoggedInToDashboard }
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs.routes').then((m) => m.routes),
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin }
    }
];
