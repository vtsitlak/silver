import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-passord/forgot-password.component';
import { RegisterComponent } from './components/register/register.component';

export const authRoutes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
