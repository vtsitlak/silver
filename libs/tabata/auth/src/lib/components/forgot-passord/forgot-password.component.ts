import { Component, computed } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import {
  FormControl,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { inject } from "@angular/core";
import { AuthStore } from "../../store/auth.store";
import { ErrorsStore } from "../../store/errors.store";

interface ForgotPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: "tbt-forgot-password",
  imports: [IonicModule, ReactiveFormsModule],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
})
export class ForgotPasswordComponent {
  private readonly authStore = inject(AuthStore);
  private readonly errorsStore = inject(ErrorsStore);
  isLoading = computed(() => this.authStore.isLoading());
  error = computed(() => this.errorsStore.errors().length > 0);
  fb: FormBuilder = inject(FormBuilder);

  form = this.fb.group<ForgotPasswordForm>({
    email: new FormControl<string>("", {
      validators: [
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        Validators.required,
      ],
      nonNullable: true,
    }),
  });

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authStore.sendPasswordResetEmail(rawForm.email);
  }
}
