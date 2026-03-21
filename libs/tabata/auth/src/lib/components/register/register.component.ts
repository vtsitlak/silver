import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonSpinner, IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AuthFacade } from '@silver/tabata/states/auth';

interface RegisterFormModel {
    email: string;
    password: string;
    displayName: string;
}

@Component({
    selector: 'tbt-register',
    imports: [FormField, IonContent, IonButton, IonSpinner, IonIcon, IonInput],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    isLoading = computed(() => this.authFacade.isLoading());
    error = computed(() => !!this.authFacade.registerError());
    readonly showPassword = signal(false);

    constructor() {
        this.authFacade.clearRegisterError();
        addIcons({ eyeOutline, eyeOffOutline });
    }

    backToLogin(): void {
        this.router.navigateByUrl('/auth/login');
    }

    registerModel = signal<RegisterFormModel>({
        email: '',
        password: '',
        displayName: ''
    });

    registerForm = form(this.registerModel, (schemaPath) => {
        required(schemaPath.displayName, { message: 'Display name is required' });
        required(schemaPath.email, { message: 'Email is required' });
        email(schemaPath.email, { message: 'Please enter a valid email address' });
        required(schemaPath.password, { message: 'Password is required' });
        minLength(schemaPath.password, 6, { message: 'Password must be at least 6 characters' });
    });

    onSubmit(): void {
        if (this.registerForm().invalid()) {
            return;
        }
        this.authFacade.register(this.registerModel());
    }
}
