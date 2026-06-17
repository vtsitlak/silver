import { TestBed } from '@angular/core/testing';
import {
    Auth,
    createUserWithEmailAndPassword,
    deleteUser,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile,
    type User,
    type UserCredential
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

jest.mock('@angular/fire/auth', () => ({
    Auth: class Auth {},
    authState: jest.fn(() => require('rxjs').of(null)),
    createUserWithEmailAndPassword: jest.fn(),
    deleteUser: jest.fn(),
    EmailAuthProvider: {
        credential: jest.fn(() => ({ providerId: 'password' }))
    },
    reauthenticateWithCredential: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn()
}));

describe('AuthService', () => {
    let service: AuthService;
    let auth: { currentUser: User | null; signOut: jest.Mock };
    const firebaseUser = { uid: 'user-123' } as User;

    beforeEach(() => {
        auth = {
            currentUser: firebaseUser,
            signOut: jest.fn(() => Promise.resolve())
        };
        jest.clearAllMocks();
        TestBed.configureTestingModule({
            providers: [{ provide: Auth, useValue: auth }]
        });
        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('updates the display name on the user returned by sign up', async () => {
        // Arrange
        const createdUser = { uid: 'created-user' } as User;
        const userCredential = { user: createdUser } as UserCredential;
        auth.currentUser = null;
        (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(userCredential);
        (updateProfile as jest.Mock).mockResolvedValue(undefined);

        // Act
        const result = await firstValueFrom(service.signUp('test@example.com', 'password123', 'New User'));

        // Assert
        expect(result).toBe(userCredential);
        expect(updateProfile).toHaveBeenCalledWith(createdUser, { displayName: 'New User' });
    });

    it('fails display name updates when Firebase has no current user', async () => {
        // Arrange
        auth.currentUser = null;

        // Act & Assert
        await expect(firstValueFrom(service.updateDisplayName('New User'))).rejects.toThrow('No user signed in.');
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it('fails password updates when Firebase has no current user', async () => {
        // Arrange
        auth.currentUser = null;

        // Act & Assert
        await expect(firstValueFrom(service.updatePassword('test@example.com', 'password123', 'newPassword123'))).rejects.toThrow('No user signed in.');
        expect(reauthenticateWithCredential).not.toHaveBeenCalled();
        expect(updatePassword).not.toHaveBeenCalled();
    });

    it('fails account deletion when Firebase has no current user', async () => {
        // Arrange
        auth.currentUser = null;

        // Act & Assert
        await expect(firstValueFrom(service.deleteCurrentUser())).rejects.toThrow('No user signed in.');
        expect(deleteUser).not.toHaveBeenCalled();
    });
});
