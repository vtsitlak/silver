import { Component, inject, linkedSignal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonHeader, IonContent, IonList, IonItem, IonInput, IonButton, IonToggle } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthStore } from '@silver/tabata/auth';
import { ProfileForm, passwordMatchValidator } from '@silver/tabata/helpers';

@Component({
    selector: 'tbt-profile',
    imports: [IonToggle, IonHeader, IonContent, ToolbarComponent, ReactiveFormsModule, IonList, IonItem, IonInput, IonButton, IonToggle, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    standalone: true
})
export class ProfileComponent implements OnInit {
    private readonly authStore = inject(AuthStore);
    private formBuilder = inject(FormBuilder);
    usePassword = linkedSignal(() => this.authStore.usePassword());
    showPasswordField = false;

    profileForm = this.formBuilder.group<ProfileForm>(
        {
            email: new FormControl<string>(
                {
                    disabled: true,
                    value: ''
                },
                { nonNullable: true }
            ),
            currentPassword: new FormControl<string>('', {
                validators: [Validators.minLength(6)]
            }),
            newPassword: new FormControl<string>('', {
                validators: [Validators.minLength(6)]
            }),
            confirmNewPassword: new FormControl<string>('', {
                validators: [Validators.minLength(6)]
            }),
            displayName: new FormControl<string>('', {
                nonNullable: true
            })
        },
        {
            validators: [passwordMatchValidator]
        }
    );

    ngOnInit(): void {
        const user = this.authStore.user();
        if (user) {
            this.profileForm.patchValue(user);
        }
    }

    togglePasswordField() {
        this.showPasswordField = !this.showPasswordField;
        if (!this.showPasswordField) {
            this.profileForm.controls.currentPassword.reset();
            this.profileForm.controls.newPassword.reset();
            this.profileForm.controls.confirmNewPassword.reset();
        }
    }

    onSubmit() {
        if (this.profileForm.valid) {
            if (this.profileForm.controls.displayName.dirty) {
                this.authStore.updateDisplayName(this.profileForm.controls.displayName.value);
            }
            if (
                this.profileForm.controls.currentPassword.value &&
                this.profileForm.controls.newPassword.value &&
                this.profileForm.controls.confirmNewPassword.value
            ) {
                this.authStore.updatePassword({
                    email: this.profileForm.controls.email.value,
                    currentPassword: this.profileForm.controls.currentPassword.value,
                    newPassword: this.profileForm.controls.newPassword.value
                });
                this.togglePasswordField();
            }
        }
    }
}
