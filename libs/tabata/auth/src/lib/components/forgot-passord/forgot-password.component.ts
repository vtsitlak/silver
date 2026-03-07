import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { IonContent, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/states/auth';

interface ForgotPasswordForm {
    email: string;
}

@Component({
    selector: 'tbt-forgot-password',
    imports: [IonContent, IonButton, IonSpinner, FormField],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
    private readonly authFacade = inject(AuthFacade);
    isLoading = computed(() => this.authFacade.isLoading());
    error = computed(() => this.authFacade.hasError());

    forgotModel = signal<ForgotPasswordForm>({
        email: ''
    });

    forgotForm = form(this.forgotModel, (schemaPath) => {
        required(schemaPath.email, { message: 'Email is required' });
        email(schemaPath.email, { message: 'Please enter a valid email address' });
    });

    onSubmit(): void {
        const { email } = this.forgotModel();
        this.authFacade.sendPasswordResetEmail(email);
    }
}
