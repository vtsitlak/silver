import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthFacade } from '../../store/auth.facade';

interface LoginFormModel {
    email: string;
    password: string;
}

@Component({
    selector: 'tbt-login',
    imports: [FormField, IonicModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    isLoading = computed(() => this.authFacade.isLoading());
    error = computed(() => this.authFacade.hasError());

    loginModel = signal<LoginFormModel>({
        email: '',
        password: ''
    });

    loginForm = form(this.loginModel, (schemaPath) => {
        required(schemaPath.email, { message: 'Email is required' });
        email(schemaPath.email, { message: 'Please enter a valid email address' });
        required(schemaPath.password, { message: 'Password is required' });
        minLength(schemaPath.password, 6, { message: 'Password must be at least 6 characters' });
    });

    onSubmit(): void {
        if (this.loginForm().invalid()) {
            return;
        }
        this.authFacade.sign(this.loginModel());
    }

    register(): void {
        this.router.navigateByUrl('/auth/register');
    }

    forgotPassword(): void {
        this.router.navigateByUrl('/auth/forgot-password');
    }
}
