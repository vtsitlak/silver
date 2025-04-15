import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonHeader, IonContent, IonList, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthStore } from '@silver/tabata/auth';

interface ProfileForm {
    email: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
    displayName: FormControl<string>;
}

@Component({
    selector: 'tbt-profile',
    imports: [IonHeader, IonContent, ToolbarComponent, ReactiveFormsModule, IonList, IonItem, IonInput, IonButton],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    standalone: true
})
export class ProfileComponent implements OnInit {
    private readonly authStore = inject(AuthStore);
    private formBuilder = inject(FormBuilder);

    profileForm = this.formBuilder.group<ProfileForm>({
        email: new FormControl<string>(
            {
                disabled: true,
                value: ''
            },
            { nonNullable: true }
        ),
        password: new FormControl<string>('', {
            validators: [Validators.required, Validators.minLength(6)],
            nonNullable: true
        }),
        confirmPassword: new FormControl<string>('', {
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
