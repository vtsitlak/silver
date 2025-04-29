import { Component, computed, inject } from '@angular/core';
import { FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RegisterForm } from '@silver/tabata/helpers';
import { AuthStore } from '../../store/auth.store';
import { ErrorsStore } from '../../store/errors.store';

@Component({
    selector: 'tbt-register',
    imports: [ReactiveFormsModule, IonicModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    fb: FormBuilder = inject(FormBuilder);
    private readonly authStore = inject(AuthStore);

    private readonly errorsStore = inject(ErrorsStore);
    isLoading = computed(() => this.authStore.isLoading());
    error = computed(() => this.errorsStore.errors().length > 0);
    router: Router = inject(Router);
    form = this.fb.group<RegisterForm>({
        email: new FormControl<string>('', {
            validators: [Validators.email, Validators.required],
            nonNullable: true
        }),
        password: new FormControl<string>(
            {
                value: '',
                disabled: false
            },
            {
                validators: [Validators.required, Validators.minLength(6)],
                nonNullable: true
            }
        ),
        displayName: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true
        })
    });

    onSubmit(): void {
        this.authStore.register(this.form.getRawValue());
    }
}
