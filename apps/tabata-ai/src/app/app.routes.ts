import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['tabs/home']);

export const routes: Routes = [
    { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
    {
        path: 'workouts/:workoutId/play',
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin },
        loadComponent: () => import('@silver/tabata/workout-player').then((m) => m.WorkoutPlayerComponent)
    },
    {
        path: 'auth',
        loadChildren: () => import('@silver/tabata/auth').then((m) => m.authRoutes),
        data: { authGuardPipe: redirectLoggedInToHome }
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs.routes').then((m) => m.routes),
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin }
    }
];
