import { TestBed } from '@angular/core/testing';
import type { User } from '@angular/fire/auth';
import { ToastService } from '@silver/tabata/helpers';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

jest.mock('@silver/tabata/helpers', () => ({
    ToastService: class ToastService {}
}));

describe('AuthStore', () => {
    const firebaseUser = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Old Name',
        photoURL: 'https://example.com/photo.png',
        providerData: [{ providerId: 'password' }]
    } as unknown as User;

    let store: InstanceType<typeof AuthStore>;
    let authService: Pick<AuthService, 'currentUser$' | 'updateDisplayName'>;

    beforeEach(() => {
        authService = {
            currentUser$: of(firebaseUser),
            updateDisplayName: jest.fn(() => of(undefined))
        };

        TestBed.configureTestingModule({
            providers: [
                AuthStore,
                { provide: AuthService, useValue: authService },
                { provide: ToastService, useValue: { showError: jest.fn(), showSuccess: jest.fn() } }
            ]
        });

        store = TestBed.inject(AuthStore);
    });

    it('preserves the current user identity when updating the display name', () => {
        // Arrange
        store.getUser();

        // Act
        store.updateDisplayName('New Name');

        // Assert
        expect(authService.updateDisplayName).toHaveBeenCalledWith('New Name');
        expect(store.user()).toEqual({
            uid: 'user-123',
            email: 'test@example.com',
            displayName: 'New Name',
            photoURL: 'https://example.com/photo.png'
        });
        expect(store.isAuthenticated()).toBe(true);
    });
});
