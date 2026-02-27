import { Routes } from '@angular/router';
import { AuthGuard, LoginComponent } from '@silver/notes-auth';
import { HomeComponent } from '@silver/notes-ui';

export const appRoutes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'notes',
        component: HomeComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'notes/search',
        component: HomeComponent,
        canActivate: [AuthGuard]
    },
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
