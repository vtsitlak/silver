import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { WorkoutsService } from '@silver/tabata/states/workouts';
import { USER_WORKOUTS_AUTH_TOKEN, type UserWorkoutsAuthTokenProvider, UserWorkoutsService } from '@silver/tabata/states/user-workouts';
import { DeleteAccountService } from './delete-account.service';

describe('DeleteAccountService', () => {
    let service: DeleteAccountService;

    const toast = { showSuccess: jest.fn(), showError: jest.fn() };
    const router = { navigateByUrl: jest.fn().mockResolvedValue(true) };

    const authFacade = { user: () => ({ uid: 'u1' }) };
    const userWorkoutsAuthToken: jest.MockedFunction<UserWorkoutsAuthTokenProvider> = jest.fn(() => 'firebase-token');
    const authService = { deleteCurrentUser: jest.fn(() => of(undefined)) };
    const workoutsService = {
        getWorkouts: jest.fn(() =>
            of([
                { id: 'w1', createdByUserId: 'u1' },
                { id: 'w2', createdByUserId: 'other' }
            ] as unknown as any)
        ),
        deleteWorkout: jest.fn(() => of({ success: true }))
    };
    const userWorkoutsService = { deleteUserWorkout: jest.fn(() => of({ success: true })) };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                DeleteAccountService,
                { provide: ToastService, useValue: toast },
                { provide: Router, useValue: router },
                { provide: AuthFacade, useValue: authFacade },
                { provide: AuthService, useValue: authService },
                { provide: WorkoutsService, useValue: workoutsService },
                { provide: UserWorkoutsService, useValue: userWorkoutsService },
                { provide: USER_WORKOUTS_AUTH_TOKEN, useValue: userWorkoutsAuthToken }
            ]
        });
        service = TestBed.inject(DeleteAccountService);
        jest.clearAllMocks();
        userWorkoutsAuthToken.mockReturnValue('firebase-token');
        authService.deleteCurrentUser.mockReturnValue(of(undefined));
        userWorkoutsService.deleteUserWorkout.mockReturnValue(of({ success: true }));
    });

    it('should delete user, delete owned workouts, delete user-workouts with the pre-delete token, then navigate + toast', (done) => {
        // Arrange
        userWorkoutsAuthToken.mockReturnValue('firebase-token');

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(true);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1', 'firebase-token');
            expect(userWorkoutsAuthToken.mock.invocationCallOrder[0]).toBeLessThan(authService.deleteCurrentUser.mock.invocationCallOrder[0]);
            expect(authService.deleteCurrentUser.mock.invocationCallOrder[0]).toBeLessThan(
                userWorkoutsService.deleteUserWorkout.mock.invocationCallOrder[0]
            );
            expect(toast.showSuccess).toHaveBeenCalledWith('Account deleted');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
            done();
        });
    });

    it('should fail before deleting the auth user when the cleanup token is missing', (done) => {
        // Arrange
        userWorkoutsAuthToken.mockReturnValue(null);

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(false);
            expect(authService.deleteCurrentUser).not.toHaveBeenCalled();
            expect(userWorkoutsService.deleteUserWorkout).not.toHaveBeenCalled();
            expect(toast.showError).toHaveBeenCalledWith('No user signed in.');
            done();
        });
    });

    it('should toast error and return false on failure', (done) => {
        // Arrange
        authService.deleteCurrentUser.mockReturnValueOnce(throwError(() => new Error('nope')));

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(false);
            expect(toast.showError).toHaveBeenCalledWith('nope');
            done();
        });
    });
});
