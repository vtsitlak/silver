import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';
// import { AuthService } from '@silver/tabata/auth';
import { ToolbarComponent } from '@silver/tabata/components';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

interface ProfileForm {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  displayName: FormControl<string>;
}

@Component({
  selector: 'tbt-profile',
  imports: [
    IonHeader,
    IonContent,
    ToolbarComponent,
    ReactiveFormsModule,
    IonList,
    IonItem,
    IonInput,
    IonButton,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  standalone: true,
})
export class ProfileComponent {
  private formBuilder = inject(FormBuilder);
  // private authService = inject(AuthService);
  private takeUntilDestroyed = takeUntilDestroyed<unknown>();

  // user = this.authService.currentUser();

  profileForm = this.formBuilder.group<ProfileForm>({
    email: new FormControl<string>(
      {
        disabled: true,
        value: '',
      },
      { nonNullable: true }
    ),
    password: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
    confirmPassword: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
    displayName: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  onSubmit() {
    // console.log('user = ', this.user);
    // this.authService.user.subscribe((user) => console.log('user = ', user));
    // if (this.profileForm.valid) {
    //   const { displayName, password } = this.profileForm.value;
    //   this.authService.updateProfile(
    //     displayName || undefined,
    //     password || undefined
    //   );
    // }
  }
}
