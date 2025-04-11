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
        loadComponent: () =>
          import('@silver/tabata/home').then((m) => m.HomeComponent),
      },
      {
        path: 'workouts',
        loadComponent: () =>
          import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'profile',
        loadComponent: () => import('@silver/tabata/profile').then((m) => m.ProfileComponent)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  }
];
