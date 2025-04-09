import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  FormControl,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { inject } from '@angular/core';

interface ForgotPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: 'tbt-forgot-password',
  imports: [CommonModule, IonicModule, ReactiveFormsModule,],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  error = false;
  fb: FormBuilder = inject(FormBuilder);
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  form = this.fb.group<ForgotPasswordForm>({
    email: new FormControl<string>('', {
      validators: [
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        Validators.required,
      ],
      nonNullable: true,
    }),
  });

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    // this.authService.login(rawForm.email, rawForm.password).subscribe({
    //   next: () => {
    //     this.router.navigateByUrl('/home');
    //   },
    //   error: (error) => {
    //     this.error = true;
    //     console.error('Email/Password Sign-In error:', error);
    //   },
    // });
  }
}
