import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthStore } from '../../store/auth.store';
import { LoginForm } from '@silver/tabata/helpers';
import { ErrorsStore } from '../../store/errors.store';

@Component({
    selector: 'tbt-login',
    imports: [CommonModule, ReactiveFormsModule, IonicModule, NgIf],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    standalone: true
})
export class LoginComponent {
    private readonly authStore = inject(AuthStore);
    private readonly router = inject(Router);
    private readonly errorsStore = inject(ErrorsStore);

    error = false;
    isSubmitting = false;
    fb: FormBuilder = inject(FormBuilder);
    form = this.fb.group<LoginForm>({
        email: new FormControl<string>('', {
            validators: [Validators.email, Validators.required],
            nonNullable: true
        }),
        password: new FormControl<string>('', {
            validators: [Validators.required, Validators.minLength(6)],
            nonNullable: true
        })
    });

    onSubmit(): void {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            this.error = false;

            // The auth store will handle the navigation and error state
            this.authStore.sign(this.form.getRawValue());

            // Reset submitting state after a short delay to allow the auth store to process
            setTimeout(() => {
                this.isSubmitting = false;
                const errors = this.errorsStore.errors();
                if (errors.length > 0) {
                    this.error = true;
                }
            }, 1000);
        }
    }

    register(): void {
        this.router.navigateByUrl('/auth/register');
    }

    forgotPassword(): void {
        this.router.navigateByUrl('/auth/forgot-password');
    }
}
