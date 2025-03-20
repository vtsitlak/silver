import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@tabata/authentication').then(m => m.authRoutes)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [() => import('@tabata/authentication').then(m => m.authGuard)]
  },
  { path: '**', redirectTo: 'tabs' }
];
