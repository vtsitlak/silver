import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { AuthStore } from '../../store/auth.store';
import { LoginForm } from '@silver/tabata/helpers';
@Component({
    selector: 'tbt-login',
    imports: [CommonModule, ReactiveFormsModule, IonicModule, NgIf],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    standalone: true
})
export class LoginComponent {
    private readonly authStore = inject(AuthStore);

    error = false;
    fb: FormBuilder = inject(FormBuilder);
    authService: AuthService = inject(AuthService);
    router: Router = inject(Router);
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
