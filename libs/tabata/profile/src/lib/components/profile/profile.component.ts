import { Component, inject, linkedSignal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonHeader, IonContent, IonList, IonItem, IonInput, IonButton, IonToggle } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthStore } from '@silver/tabata/auth';
import { timeout } from 'rxjs';

interface ProfileForm {
    email: FormControl<string>;
    currentPassword: FormControl<string>;
    newPassword: FormControl<string>;
    confirmNewPassword: FormControl<string>;
    displayName: FormControl<string>;
}

@Component({
    selector: 'tbt-profile',
    imports: [IonToggle, IonHeader, IonContent, ToolbarComponent, ReactiveFormsModule, IonList, IonItem, IonInput, IonButton, IonToggle],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    standalone: true
})
export class ProfileComponent implements OnInit {
    private readonly authStore = inject(AuthStore);
    private formBuilder = inject(FormBuilder);
    usePassword = linkedSignal(() => this.authStore.usePassword());

    profileForm = this.formBuilder.group<ProfileForm>({
        email: new FormControl<string>(
            {
                disabled: true,
                value: ''
            },
            { nonNullable: true }
        ),
        currentPassword: new FormControl<string>('', {
            validators: [Validators.required, Validators.minLength(6)],
            nonNullable: true
        }),
        newPassword: new FormControl<string>('', {
          validators: [Validators.required, Validators.minLength(6)],
          nonNullable: true
      }),
        confirmNewPassword: new FormControl<string>('', {
            validators: [Validators.required, Validators.minLength(6)],
            nonNullable: true
        }),
        displayName: new FormControl<string>('', {
            nonNullable: true
        })
    });

    ngOnInit(): void {
        const user = this.authStore.user();
        if (user) {
            this.profileForm.patchValue(user);
            setTimeout(() => {
              console.log('usePassword = ', this.authStore.usePassword());
            }, 50000);

        }
       }

    // user = this.authService.currentUser();

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
