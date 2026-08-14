import { TestBed } from '@angular/core/testing';
import type { User } from '@angular/fire/auth';
import { ToastService } from '@silver/tabata/helpers';
import { BehaviorSubject, of, Subject } from 'rxjs';
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
    let authService: {
        currentUser$: AuthService['currentUser$'];
        updateDisplayName: jest.Mock;
        sign: jest.Mock;
    };

    beforeEach(() => {
        authService = {
            currentUser$: of(firebaseUser),
            updateDisplayName: jest.fn(() => of(undefined)),
            sign: jest.fn(() => of({ user: firebaseUser }))
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

    it('clears the current user when auth state emits signed out after a prior user', () => {
        // Arrange
        const currentUser$ = new BehaviorSubject<User | null>(firebaseUser);
        authService.currentUser$ = currentUser$.asObservable();
        store.getUser();

        // Act
        currentUser$.next(null);

        // Assert
        expect(store.user()).toBeNull();
        expect(store.usePassword()).toBe(false);
        expect(store.useGoogle()).toBe(false);
        expect(store.isAuthenticated()).toBe(false);
    });

    it('does not treat a late signed-out authState as sign-in completion', () => {
        const currentUser$ = new Subject<User | null>();
        const signResponse = new Subject<{ user: User }>();
        authService.currentUser$ = currentUser$.asObservable();
        authService.sign.mockReturnValue(signResponse.asObservable());

        store.getUser();
        store.sign({ email: 'test@example.com', password: 'password123' });

        expect(store.isLoading()).toBe(true);

        // Firebase authState often emits null when Auth finishes initializing — after Playwright
        // already submitted credentials. That must not clear isLoading or drop the in-flight sign.
        currentUser$.next(null);

        expect(store.isLoading()).toBe(true);
        expect(store.user()).toBeNull();
        expect(store.isAuthenticated()).toBe(false);

        signResponse.next({ user: firebaseUser });
        signResponse.complete();

        expect(store.user()?.email).toBe('test@example.com');
        expect(store.isLoading()).toBe(false);
        expect(store.isAuthenticated()).toBe(true);
    });
});
