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
        // Show toast when error occurs
        effect(() => {
            const error = this.store.error();
            if (isNonNullish(error)) {
                this.toast.showError(error);
            }
        });

        // Navigate when loading completes successfully
        effect(() => {
            const isLoading = this.store.isLoading();
            const error = this.store.error();
            const path = this.pendingNavigation();

            if (isNonNullish(path) && !isLoading && isNullish(error)) {
                this.router.navigateByUrl(path);
                this.pendingNavigation.set(null);
            }
        });
    }

    // State
    readonly user = this.store.user;
    readonly error = this.store.error;
    readonly isLoading = this.store.isLoading;
    readonly isAuthenticated = this.store.isAuthenticated;
    readonly usePassword = this.store.usePassword;
    readonly useGoogle = this.store.useGoogle;

    /** Computed: true when there is an error message (for UI). */
    readonly hasError = computed(() => isNonNullish(this.store.error()));

    // Methods
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
