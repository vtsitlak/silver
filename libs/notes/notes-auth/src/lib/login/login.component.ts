import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatInput, MatError } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { AuthFacade } from '../store/auth.facade';

@Component({
    selector: 'lib-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, FormField, MatFormField, MatInput, MatError, MatButton]
})
export class LoginComponent {
    authFacade = inject(AuthFacade);

    loginModel = signal({
        email: 'user1@email.com',
        password: 'test'
    });

    loginForm = form(this.loginModel, (schemaPath) => {
        required(schemaPath.email, { message: 'Email is required' });
        required(schemaPath.password, { message: 'Password is required' });
    });

    login() {
        const formData = this.loginModel();
        if (formData.email && formData.password) {
            this.authFacade.login(formData.email, formData.password);
        }
        // Navigation is handled by the store's login method via router.navigateByUrl
    }
}
