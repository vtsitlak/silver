import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthStore } from '../../store/auth.store';
import { LoginForm } from '@silver/tabata/helpers';
import { ErrorsStore } from '../../store/errors.store';
import { Subscription } from 'rxjs';

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
    isLoading = computed(() => this.authStore.isLoading());
    error = computed(() => this.errorsStore.errors().length > 0);

    //error = false;
    //isSubmitting = false;
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
      this.authStore.sign(this.form.getRawValue())
        // if (this.form.valid) {
        //     // this.isSubmitting = true;
        //     // this.error = false;

        //     // this.subscription = this.authStore.sign(this.form.getRawValue())

        //     // The auth store will handle the navigation and error state
        //     this.authStore.sign(this.form.getRawValue())

        //     this.authStore.sign(this.form.getRawValue()) // Call the RxMethod to get the Observable


        //     // Reset submitting state after a short delay to allow the auth store to process
        //     setTimeout(() => {
        //         this.isSubmitting = false;
        //         const errors = this.errorsStore.errors();
        //         if (errors.length > 0) {
        //             this.error = true;
        //         }
        //     }, 1000);
        //}
    }

    register(): void {
        this.router.navigateByUrl('/auth/register');
    }

    forgotPassword(): void {
        this.router.navigateByUrl('/auth/forgot-password');
    }
}
