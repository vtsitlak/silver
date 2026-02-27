import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { TabsComponent } from '@silver/tabata/ui';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['tabs/home']);

export const routes: Routes = [
    { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
    {
        path: 'auth',
        loadChildren: () => import('@silver/tabata/auth').then((m) => m.authRoutes),
        data: { authGuardPipe: redirectLoggedInToHome }
    },
    {
        path: 'tabs',
        loadChildren: () => tabRoutes,
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin }
    }
];

export const tabRoutes: Routes = [
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
