import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@silver/shared/helpers';
import { AuthEventsService } from './auth-events.service';
import { AuthStore } from './auth.store';
import type { LoginUser, NewUser, UpdatePasswordDetails } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private readonly store = inject(AuthStore);
    private readonly authEvents = inject(AuthEventsService);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastService);

    constructor() {
        this.authEvents.events.subscribe((event) => {
            if ('message' in event) {
                this.toast.show(event.message);
            }
            if ('navigateTo' in event && event.navigateTo) {
                this.router.navigateByUrl(event.navigateTo);
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
    readonly hasError = computed(() => !!this.store.error());

    // Methods
    getUser(): void {
        this.store.getUser();
    }

    sign(credentials: LoginUser): void {
        this.store.sign(credentials);
    }

    signWithGoogle(): void {
        this.store.signWithGoogle();
    }

    register(newUser: NewUser): void {
        this.store.register(newUser);
    }

    sendPasswordResetEmail(email: string): void {
        this.store.sendPasswordResetEmail(email);
    }

    updateDisplayName(displayName: string): void {
        this.store.updateDisplayName(displayName);
    }

    updatePassword(details: UpdatePasswordDetails): void {
        this.store.updatePassword(details);
    }

    logout(): void {
        this.store.logout();
    }
}
