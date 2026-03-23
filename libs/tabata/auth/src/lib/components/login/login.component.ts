import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonSpinner, IonIcon, IonInput, ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, informationCircleOutline } from 'ionicons/icons';
import { AuthFacade } from '@silver/tabata/states/auth';

interface LoginFormModel {
    email: string;
    password: string;
}

@Component({
    selector: 'tbt-login',
    imports: [FormField, IonContent, IonButton, IonSpinner, IonIcon, IonInput],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly actionSheetCtrl = inject(ActionSheetController);
    isLoading = computed(() => this.authFacade.isLoading());
    error = computed(() => !!this.authFacade.loginError());
    readonly showPassword = signal(false);

    constructor() {
        addIcons({ informationCircleOutline, eyeOutline, eyeOffOutline });
    }

    ionViewWillEnter(): void {
        this.authFacade.clearLoginError();
    }

    loginModel = signal<LoginFormModel>({
        email: '',
        password: ''
    });

    loginForm = form(this.loginModel, (schemaPath) => {
        required(schemaPath.email, { message: 'Email is required' });
        email(schemaPath.email, { message: 'Please enter a valid email address' });
        required(schemaPath.password, { message: 'Password is required' });
        minLength(schemaPath.password, 6, { message: 'Password must be at least 6 characters' });
    });

    onSubmit(): void {
        if (this.loginForm().invalid()) {
            return;
        }
        this.authFacade.sign(this.loginModel());
    }

    register(): void {
        this.router.navigateByUrl('/auth/register');
    }

    forgotPassword(): void {
        this.router.navigateByUrl('/auth/forgot-password');
    }

    async openInfoSheet(): Promise<void> {
        const sheet = await this.actionSheetCtrl.create({
            header: 'About this app',
            subHeader:
                'When viewed from web, switch to mobile view (DevTools or responsive mode) for the best experience.\n\n' +
                'Demo app — for practice and example code only.\n\n' +
                '• This is a demonstration application for learning and practicing. It is not intended for commercial use.\n' +
                '• Login and authentication are powered by Firebase (Firebase Auth). Your credentials are handled by Firebase services.\n' +
                '• Workout data and AI-generated content are for illustration purposes only.\n' +
                '• Use this app as reference code or for personal practice only.\n' +
                '• Tested only on web and Android (OnePlus 10 Pro). Other devices and iOS have not been tested.\n\n' +
                'Credentials are handled by Firebase Auth.\n' +
                'GitHub: vtsitlak',
            cssClass: 'tbt-action-sheet-visible',
            buttons: [{ text: 'Close', role: 'cancel' }]
        });
        await sheet.present();
    }
}
