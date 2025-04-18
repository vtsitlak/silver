import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RegisterForm } from '@silver/tabata/helpers';
import { AuthStore } from '../../store/auth.store';

@Component({
    selector: 'tbt-register',
    imports: [CommonModule, ReactiveFormsModule, IonicModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
    standalone: true
})
export class RegisterComponent {
    error = false;
    fb: FormBuilder = inject(FormBuilder);
    private readonly authStore = inject(AuthStore);
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
