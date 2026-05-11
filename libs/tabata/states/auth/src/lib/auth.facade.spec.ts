import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from './auth.facade';
import { AuthStore } from './auth.store';
import type { LoginUser, NewUser } from './auth.models';

jest.mock('@silver/tabata/helpers', () => ({
    ToastService: class ToastService {}
}));

describe('AuthFacade', () => {
    let facade: AuthFacade;
    let store: {
        loginError: WritableSignal<string | null>;
        getUserError: WritableSignal<string | null>;
        sendPasswordError: WritableSignal<string | null>;
        registerError: WritableSignal<string | null>;
        updateDisplayNameError: WritableSignal<string | null>;
        updatePasswordError: WritableSignal<string | null>;
        logoutError: WritableSignal<string | null>;
        isLoading: WritableSignal<boolean>;
        user: WritableSignal<null>;
        usePassword: WritableSignal<boolean>;
        useGoogle: WritableSignal<boolean>;
        isAuthenticated: WritableSignal<boolean>;
        clearError: jest.Mock;
        clearLoginError: jest.Mock;
        clearRegisterError: jest.Mock;
        clearSendPasswordError: jest.Mock;
        getUser: jest.Mock;
        sign: jest.Mock;
        signWithGoogle: jest.Mock;
        register: jest.Mock;
        sendPasswordResetEmail: jest.Mock;
        updateDisplayName: jest.Mock;
        updatePassword: jest.Mock;
        logout: jest.Mock;
    };

    beforeEach(() => {
        store = {
            loginError: signal(null),
            getUserError: signal(null),
            sendPasswordError: signal(null),
            registerError: signal(null),
            updateDisplayNameError: signal(null),
            updatePasswordError: signal(null),
            logoutError: signal(null),
            isLoading: signal(false),
            user: signal(null),
            usePassword: signal(false),
            useGoogle: signal(false),
            isAuthenticated: signal(false),
            clearError: jest.fn(() => {
                store.loginError.set(null);
                store.getUserError.set(null);
                store.sendPasswordError.set(null);
                store.registerError.set(null);
                store.updateDisplayNameError.set(null);
                store.updatePasswordError.set(null);
                store.logoutError.set(null);
            }),
            clearLoginError: jest.fn(),
            clearRegisterError: jest.fn(),
            clearSendPasswordError: jest.fn(),
            getUser: jest.fn(),
            sign: jest.fn(),
            signWithGoogle: jest.fn(),
            register: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            updateDisplayName: jest.fn(),
            updatePassword: jest.fn(),
            logout: jest.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                AuthFacade,
                { provide: AuthStore, useValue: store },
                { provide: Router, useValue: { navigateByUrl: jest.fn() } },
                { provide: ToastService, useValue: { showError: jest.fn(), showSuccess: jest.fn() } }
            ]
        });

        facade = TestBed.inject(AuthFacade);
    });

    it('clears stale auth errors before signing in', () => {
        // Arrange
        const credentials: LoginUser = { email: 'test@example.com', password: 'password123' };
        store.registerError.set('Email already in use');

        // Act
        facade.sign(credentials);

        // Assert
        expect(store.clearError).toHaveBeenCalledTimes(1);
        expect(store.sign).toHaveBeenCalledWith(credentials);
        expect(store.clearError.mock.invocationCallOrder[0]).toBeLessThan(store.sign.mock.invocationCallOrder[0]);
    });

    it('clears stale auth errors before registering', () => {
        // Arrange
        const newUser: NewUser = { displayName: 'Test User', email: 'test@example.com', password: 'password123' };
        store.loginError.set('Invalid credentials');

        // Act
        facade.register(newUser);

        // Assert
        expect(store.clearError).toHaveBeenCalledTimes(1);
        expect(store.register).toHaveBeenCalledWith(newUser);
        expect(store.clearError.mock.invocationCallOrder[0]).toBeLessThan(store.register.mock.invocationCallOrder[0]);
    });
});
