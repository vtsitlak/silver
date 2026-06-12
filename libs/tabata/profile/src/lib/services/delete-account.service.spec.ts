import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { type TabataWorkout, WorkoutsService } from '@silver/tabata/states/workouts';
import { USER_WORKOUTS_AUTH_TOKEN, UserWorkoutsService } from '@silver/tabata/states/user-workouts';
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
    const userWorkoutsAuthToken = jest.fn(() => 'captured-token');
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
                { provide: USER_WORKOUTS_AUTH_TOKEN, useValue: userWorkoutsAuthToken },
                { provide: WorkoutsService, useValue: workoutsService },
                { provide: UserWorkoutsService, useValue: userWorkoutsService }
            ]
        });
        service = TestBed.inject(DeleteAccountService);
        jest.clearAllMocks();
        authService.deleteCurrentUser.mockReturnValue(of(undefined));
        userWorkoutsAuthToken.mockReturnValue('captured-token');
        workoutsService.getWorkouts.mockReturnValue(of([createWorkout('w1', 'u1'), createWorkout('w2', 'other')]));
        workoutsService.deleteWorkout.mockReturnValue(of({ success: true }));
        userWorkoutsService.deleteUserWorkout.mockReturnValue(of({ success: true }));
    });

    it('should delete the user account before destructive workout cleanup while reusing the captured token', (done) => {
        // Arrange
        const calls: string[] = [];
        userWorkoutsAuthToken.mockImplementation(() => {
            calls.push('capture-token');
            return 'captured-token';
        });
        workoutsService.getWorkouts.mockImplementation(() => {
            calls.push('get-workouts');
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
            return of(undefined);
        });

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(true);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1', 'captured-token');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1', 'captured-token');
            expect(calls).toEqual([
                'capture-token',
                'get-workouts',
                'delete-current-user',
                'delete-workout:w1:captured-token',
                'delete-user-workout:u1:captured-token'
            ]);
            expect(toast.showSuccess).toHaveBeenCalledWith('Account deleted');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
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

    it('should not delete workout data when Firebase account deletion fails', (done) => {
        // Arrange
        authService.deleteCurrentUser.mockReturnValueOnce(throwError(() => new Error('nope')));

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(false);
            expect(workoutsService.getWorkouts).toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).not.toHaveBeenCalled();
            expect(userWorkoutsService.deleteUserWorkout).not.toHaveBeenCalled();
            expect(toast.showError).toHaveBeenCalledWith('nope');
            done();
        });
    });

    it('should surface cleanup failure and skip success navigation', (done) => {
        // Arrange
        userWorkoutsService.deleteUserWorkout.mockReturnValueOnce(throwError(() => new Error('cleanup failed')));

        // Act
        service.deleteAccount().subscribe((ok) => {
            // Assert
            expect(ok).toBe(false);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1', 'captured-token');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1', 'captured-token');
            expect(toast.showError).toHaveBeenCalledWith('cleanup failed');
            expect(router.navigateByUrl).not.toHaveBeenCalled();
            done();
        });
    });
});
