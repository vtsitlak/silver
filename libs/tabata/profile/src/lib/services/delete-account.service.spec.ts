import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { type TabataWorkout, WORKOUTS_AUTH_TOKEN, WorkoutsService } from '@silver/tabata/states/workouts';
import { USER_WORKOUTS_AUTH_TOKEN, type UserWorkoutsAuthTokenProvider, UserWorkoutsService } from '@silver/tabata/states/user-workouts';
import { DeleteAccountService } from './delete-account.service';

describe('DeleteAccountService', () => {
    let service: DeleteAccountService;

    const toast = { showSuccess: jest.fn(), showError: jest.fn() };
    const router = { navigateByUrl: jest.fn().mockResolvedValue(true) };
    const createWorkout = (id: string, createdByUserId: string): TabataWorkout => ({
        id,
        name: id,
        description: '',
        totalDurationMinutes: 0,
        warmup: { totalDurationSeconds: 0, movements: [] },
        blocks: [],
        cooldown: { totalDurationSeconds: 0, movements: [] },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        updatedByUserId: createdByUserId,
        createdByUserId,
        generatedByAi: false,
        mainTargetBodypart: 'Full Body',
        secondaryTargetBodyparts: [],
        availableEquipments: []
    });

    const authFacade = { user: () => ({ uid: 'u1' }) };
    const authService = { deleteCurrentUser: jest.fn(() => of(undefined)) };
    const workoutsAuthToken = jest.fn(() => 'captured-workouts-token');
    const userWorkoutsAuthToken: jest.MockedFunction<UserWorkoutsAuthTokenProvider> = jest.fn(() => 'captured-token');
    const workoutsService = {
        getWorkouts: jest.fn(() => of([createWorkout('w1', 'u1'), createWorkout('w2', 'other')])),
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
                { provide: WORKOUTS_AUTH_TOKEN, useValue: workoutsAuthToken },
                { provide: USER_WORKOUTS_AUTH_TOKEN, useValue: userWorkoutsAuthToken },
                { provide: WorkoutsService, useValue: workoutsService },
                { provide: UserWorkoutsService, useValue: userWorkoutsService }
            ]
        });
        service = TestBed.inject(DeleteAccountService);
        jest.clearAllMocks();
        authService.deleteCurrentUser.mockReturnValue(of(undefined));
        workoutsAuthToken.mockReturnValue('captured-workouts-token');
        userWorkoutsAuthToken.mockReturnValue('captured-token');
        workoutsService.getWorkouts.mockReturnValue(of([createWorkout('w1', 'u1'), createWorkout('w2', 'other')]));
        workoutsService.deleteWorkout.mockReturnValue(of({ success: true }));
        userWorkoutsService.deleteUserWorkout.mockReturnValue(of({ success: true }));
    });

    it('should delete Firebase first then wipe Upstash with captured tokens', (done) => {
        // Arrange
        const calls: string[] = [];
        userWorkoutsAuthToken.mockImplementation(() => {
            calls.push('capture-user-workouts-token');
            return 'captured-token';
        });
        workoutsAuthToken.mockImplementation(() => {
            calls.push('capture-workouts-token');
            return 'captured-workouts-token';
        });
        workoutsService.getWorkouts.mockImplementation((_search?: string, token?: string) => {
            calls.push(`get-workouts:${token}`);
            return of([createWorkout('w1', 'u1'), createWorkout('w2', 'other')]);
        });
        workoutsService.deleteWorkout.mockImplementation((id: string, token?: string) => {
            calls.push(`delete-workout:${id}:${token}`);
            return of({ success: true });
        });
        userWorkoutsService.deleteUserWorkout.mockImplementation((userId: string, token?: string) => {
            calls.push(`delete-user-workout:${userId}:${token}`);
            return of({ success: true });
        });
        authService.deleteCurrentUser.mockImplementationOnce(() => {
            calls.push('delete-current-user');
            userWorkoutsAuthToken.mockReturnValue(null);
            workoutsAuthToken.mockReturnValue(null);
            return of(undefined);
        });

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert — Firebase delete is the operation that fails on persisted sessions
            // (requires-recent-login). Do it before any Upstash wipe so a returning user
            // who taps Delete account does not lose workouts/history while still signed in.
            // Cleanup must still use captured tokens because deleteUser clears live auth.
            expect(ok).toBe(true);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).toHaveBeenCalledWith(undefined, 'captured-workouts-token');
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1', 'captured-workouts-token');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1', 'captured-token');
            expect(calls).toEqual([
                'capture-workouts-token',
                'capture-user-workouts-token',
                'delete-current-user',
                'get-workouts:captured-workouts-token',
                'delete-workout:w1:captured-workouts-token',
                'delete-user-workout:u1:captured-token'
            ]);
            expect(toast.showSuccess).toHaveBeenCalledWith('Account deleted');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
            done();
        });
    });

    it('should still list owned workouts with the captured token after the live auth provider clears', (done) => {
        // Arrange — simulate another tab signing out after tokens were captured.
        workoutsAuthToken.mockImplementationOnce(() => 'captured-workouts-token').mockReturnValue(null);
        userWorkoutsAuthToken.mockImplementationOnce(() => 'captured-token').mockReturnValue(null);
        workoutsService.getWorkouts.mockImplementation((_search?: string, token?: string) => {
            // Without the captured token this would look like an unauthenticated list (no owned rows).
            if (token !== 'captured-workouts-token') {
                return of([createWorkout('public', 'other')]);
            }
            return of([createWorkout('w1', 'u1'), createWorkout('public', 'other')]);
        });

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(true);
            expect(workoutsService.getWorkouts).toHaveBeenCalledWith(undefined, 'captured-workouts-token');
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1', 'captured-workouts-token');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1', 'captured-token');
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            done();
        });
    });

    it('should stop before deleting the user account when no workouts cleanup token is available', (done) => {
        // Arrange
        workoutsAuthToken.mockReturnValue(null);

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(false);
            expect(authService.deleteCurrentUser).not.toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).not.toHaveBeenCalled();
            expect(userWorkoutsService.deleteUserWorkout).not.toHaveBeenCalled();
            expect(toast.showError).toHaveBeenCalledWith('No user signed in.');
            done();
        });
    });

    it('should stop before deleting the user account when no cleanup token is available', (done) => {
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

    it('should not wipe workouts or history when Firebase delete fails (requires-recent-login)', (done) => {
        // Arrange — persisted sessions fail deleteUser until the user signs in again.
        authService.deleteCurrentUser.mockReturnValueOnce(throwError(() => new Error('requires-recent-login')));

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert — account and Upstash data both remain so the user can re-auth and retry.
            expect(ok).toBe(false);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).not.toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).not.toHaveBeenCalled();
            expect(userWorkoutsService.deleteUserWorkout).not.toHaveBeenCalled();
            expect(toast.showError).toHaveBeenCalledWith('requires-recent-login');
            expect(router.navigateByUrl).not.toHaveBeenCalled();
            done();
        });
    });

    it('should surface Upstash cleanup failure after Firebase delete using captured tokens', (done) => {
        // Arrange
        authService.deleteCurrentUser.mockImplementationOnce(() => {
            userWorkoutsAuthToken.mockReturnValue(null);
            workoutsAuthToken.mockReturnValue(null);
            return of(undefined);
        });
        workoutsService.deleteWorkout.mockReturnValueOnce(throwError(() => new Error('workout wipe failed')));

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert — Firebase already succeeded; cleanup still used the captured token.
            expect(ok).toBe(false);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).toHaveBeenCalledWith(undefined, 'captured-workouts-token');
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1', 'captured-workouts-token');
            expect(userWorkoutsService.deleteUserWorkout).not.toHaveBeenCalled();
            expect(toast.showError).toHaveBeenCalledWith('workout wipe failed');
            expect(router.navigateByUrl).not.toHaveBeenCalled();
            done();
        });
    });
});
