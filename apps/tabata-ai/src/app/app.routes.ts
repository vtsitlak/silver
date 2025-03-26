import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@silver/tabata/authentication').then(m => m.authRoutes)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [ () => import('@silver/tabata/authentication').then(m => m.AuthGuard)]
  },
  { path: '**', redirectTo: 'tabs' }
];
