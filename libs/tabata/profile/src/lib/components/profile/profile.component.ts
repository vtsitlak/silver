import { Component, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { disabled, email, form, FormField, required, validate } from '@angular/forms/signals';
import { IonHeader, IonContent, IonButton, IonToggle, IonSpinner, IonIcon, ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthFacade } from '@silver/tabata/auth';
import { DeleteAccountService } from '../../services/delete-account.service';

interface ProfileFormModel {
    displayName: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

@Component({
    selector: 'tbt-profile',
    imports: [IonToggle, IonHeader, IonContent, ToolbarComponent, FormField, IonButton, IonSpinner, IonIcon],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    private readonly authFacade = inject(AuthFacade);
    private readonly actionSheetCtrl = inject(ActionSheetController);
    private readonly deleteAccountService = inject(DeleteAccountService);
    usePassword = linkedSignal(() => this.authFacade.usePassword());
    isLoading = linkedSignal(() => this.authFacade.isLoading());
    showPasswordField = false;

    profileModel = signal<ProfileFormModel>({
        displayName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    profileForm = form(this.profileModel, (schemaPath) => {
        disabled(schemaPath.email, () => true);
        required(schemaPath.displayName, { message: 'Display name is required' });
        required(schemaPath.email, { message: 'Email is required' });
        email(schemaPath.email, { message: 'Please enter a valid email address' });
        validate(schemaPath.currentPassword, ({ value }) => {
            const v = value();
            if (v == null || v === '') return null;
            return v.length >= 6 ? null : { kind: 'minLength', message: 'Password must be at least 6 characters' };
        });
        validate(schemaPath.newPassword, ({ value }) => {
            const v = value();
            if (v == null || v === '') return null;
            return v.length >= 6 ? null : { kind: 'minLength', message: 'Password must be at least 6 characters' };
        });
        validate(schemaPath.confirmNewPassword, ({ value, valueOf }) => {
            const v = value();
            if (v == null || v === '') return null;
            if (v.length < 6) return { kind: 'minLength', message: 'Password must be at least 6 characters' };
            const newPwd = valueOf(schemaPath.newPassword);
            return newPwd === v ? null : { kind: 'passwordMismatch', message: 'Passwords do not match' };
        });
    });

    constructor() {
        addIcons({ logOutOutline });
    }

    ngOnInit(): void {
        const user = this.authFacade.user();
        if (user) {
            this.profileModel.set({
                displayName: user.displayName ?? '',
                email: user.email ?? '',
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
        }
    }

    togglePasswordField(): void {
        this.showPasswordField = !this.showPasswordField;
        if (!this.showPasswordField) {
            this.profileModel.update((m) => ({
                ...m,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            }));
        }
    }

    onSubmit(): void {
        if (this.profileForm().invalid()) return;
        const model = this.profileModel();
        if (this.profileForm.displayName().dirty()) {
            this.authFacade.updateDisplayName(model.displayName);
        }
        if (
            model.currentPassword &&
            model.newPassword &&
            model.confirmNewPassword &&
            this.profileForm.newPassword().valid() &&
            this.profileForm.confirmNewPassword().valid()
        ) {
            this.authFacade.updatePassword({
                email: model.email,
                currentPassword: model.currentPassword,
                newPassword: model.newPassword
            });
            this.togglePasswordField();
        }
    }

    async onLogoutClick(): Promise<void> {
        const sheet = await this.actionSheetCtrl.create({
            header: 'Log out?',
            subHeader: 'You will need to sign in again to use the app.',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                { text: 'Log out', role: 'destructive', handler: () => this.authFacade.logout() }
            ]
        });
        await sheet.present();
    }

    async onDeleteAccountClick(): Promise<void> {
        const sheet = await this.actionSheetCtrl.create({
            header: 'Delete account?',
            subHeader: 'This will permanently delete your account and all your workout data. This cannot be undone.',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete account',
                    role: 'destructive',
                    handler: () => {
                        this.deleteAccountService.deleteAccount().subscribe();
                    }
                }
            ]
        });
        await sheet.present();
    }
}
