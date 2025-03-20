import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

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
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  form = this.fb.group<LoginForm>({
    email: new FormControl<string>('', {
      validators: [
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        Validators.required,
      ],
      nonNullable: true,
    }),
    password: new FormControl<string>(
      {
        value: '',
        disabled: false,
      },
      {
        validators: [Validators.required, Validators.minLength(6)],
        nonNullable: true,
      }
    ),
  });

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authService.register(rawForm.email, rawForm.password).subscribe({
      next: () => {
        this.router.navigateByUrl('/home');
      },
      error: (error) => {
        this.error = true;
        console.error('Email/Password Sign-In error:', error);
      },
    });
  }
}
