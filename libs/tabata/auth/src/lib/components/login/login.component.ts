import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthStore } from '../../store/auth.store';
import { LoginForm } from '@silver/tabata/helpers';
import { ErrorsStore } from '../../store/errors.store';

@Component({
    selector: 'tbt-login',
    imports: [ReactiveFormsModule, IonicModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private readonly authStore = inject(AuthStore);
    private readonly router = inject(Router);
    private readonly errorsStore = inject(ErrorsStore);
    isLoading = computed(() => this.authStore.isLoading());
    error = computed(() => this.errorsStore.errors().length > 0);

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
        this.authStore.sign(this.form.getRawValue());
    }

    register(): void {
        this.router.navigateByUrl('/auth/register');
    }

    forgotPassword(): void {
        this.router.navigateByUrl('/auth/forgot-password');
    }
}
