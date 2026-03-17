import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { isNonNullish, isNullish } from '@silver/shared/helpers';
import { ToastService } from '@silver/tabata/helpers';
import { AuthStore } from './auth.store';
import type { LoginUser, NewUser, UpdatePasswordDetails } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private readonly store = inject(AuthStore);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastService);

    private readonly pendingNavigation = signal<string | null>(null);

    constructor() {
        // Show toast when any auth error occurs
        effect(() => {
            const msg =
                this.store.loginError() ??
                this.store.getUserError() ??
                this.store.sendPasswordError() ??
                this.store.registerError() ??
                this.store.updateDisplayNameError() ??
                this.store.updatePasswordError() ??
                this.store.logoutError();
            if (isNonNullish(msg)) {
                this.toast.showError(msg);
            }
        });

        // Navigate when loading completes successfully (no error for the current operation)
        effect(() => {
            const isLoading = this.store.isLoading();
            const hasAnyError =
                isNonNullish(this.store.loginError()) ||
                isNonNullish(this.store.getUserError()) ||
                isNonNullish(this.store.sendPasswordError()) ||
                isNonNullish(this.store.registerError()) ||
                isNonNullish(this.store.updateDisplayNameError()) ||
                isNonNullish(this.store.updatePasswordError()) ||
                isNonNullish(this.store.logoutError());
            const path = this.pendingNavigation();

            if (isNonNullish(path) && !isLoading && !hasAnyError) {
                this.router.navigateByUrl(path);
                this.pendingNavigation.set(null);
            }
        });
    }

    // State
    readonly user = this.store.user;
    readonly loginError = this.store.loginError;
    readonly getUserError = this.store.getUserError;
    readonly sendPasswordError = this.store.sendPasswordError;
    readonly registerError = this.store.registerError;
    readonly updateDisplayNameError = this.store.updateDisplayNameError;
    readonly updatePasswordError = this.store.updatePasswordError;
    readonly logoutError = this.store.logoutError;
    readonly isLoading = this.store.isLoading;
    readonly isAuthenticated = this.store.isAuthenticated;
    readonly usePassword = this.store.usePassword;
    readonly useGoogle = this.store.useGoogle;

    /** Computed: true when there is any error message (for UI). */
    readonly hasError = computed(
        () =>
            isNonNullish(this.store.loginError()) ||
            isNonNullish(this.store.getUserError()) ||
            isNonNullish(this.store.sendPasswordError()) ||
            isNonNullish(this.store.registerError()) ||
            isNonNullish(this.store.updateDisplayNameError()) ||
            isNonNullish(this.store.updatePasswordError()) ||
            isNonNullish(this.store.logoutError())
    );

    // Methods
    clearError(): void {
        this.pendingNavigation.set(null);
        this.store.clearError();
    }
    clearLoginError(): void {
        this.store.clearLoginError();
    }
    clearRegisterError(): void {
        this.store.clearRegisterError();
    }
    clearSendPasswordError(): void {
        this.store.clearSendPasswordError();
    }
    getUser(): void {
        this.store.getUser();
    }

    sign(credentials: LoginUser): void {
        this.pendingNavigation.set('/tabs/dashboard');
        this.store.sign(credentials);
    }

    signWithGoogle(): void {
        this.pendingNavigation.set('/tabs/dashboard');
        this.store.signWithGoogle();
    }

    register(newUser: NewUser): void {
        this.pendingNavigation.set('/tabs/dashboard');
        this.store.register(newUser);
    }

    sendPasswordResetEmail(email: string): void {
        this.pendingNavigation.set('/auth/login');
        this.store.sendPasswordResetEmail(email);
    }

    updateDisplayName(displayName: string): void {
        this.store.updateDisplayName(displayName);
    }

    updatePassword(details: UpdatePasswordDetails): void {
        this.store.updatePassword(details);
    }

    logout(): void {
        this.pendingNavigation.set('/auth/login');
        this.store.logout();
    }
}
