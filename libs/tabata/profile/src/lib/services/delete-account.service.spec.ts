import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { WorkoutsService } from '@silver/tabata/states/workouts';
import { UserWorkoutsService } from '@silver/tabata/states/user-workouts';
import { DeleteAccountService } from './delete-account.service';

describe('DeleteAccountService', () => {
    let service: DeleteAccountService;

    const toast = { showSuccess: jest.fn(), showError: jest.fn() };
    const router = { navigateByUrl: jest.fn().mockResolvedValue(true) };

    const authFacade = { user: () => ({ uid: 'u1' }) };
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
                { provide: UserWorkoutsService, useValue: userWorkoutsService }
            ]
        });
        service = TestBed.inject(DeleteAccountService);
        jest.clearAllMocks();
    });

    it('should delete user, delete owned workouts, delete user-workouts, then navigate + toast', (done) => {
        service.deleteAccount().subscribe((ok) => {
            expect(ok).toBe(true);
            expect(authService.deleteCurrentUser).toHaveBeenCalled();
            expect(workoutsService.getWorkouts).toHaveBeenCalled();
            expect(workoutsService.deleteWorkout).toHaveBeenCalledWith('w1');
            expect(userWorkoutsService.deleteUserWorkout).toHaveBeenCalledWith('u1');
            expect(toast.showSuccess).toHaveBeenCalledWith('Account deleted');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
            done();
        });
    });

    it('should toast error and return false on failure', (done) => {
        authService.deleteCurrentUser.mockReturnValueOnce(throwError(() => new Error('nope')));
        service.deleteAccount().subscribe((ok) => {
            expect(ok).toBe(false);
            expect(toast.showError).toHaveBeenCalledWith('nope');
            done();
        });
    });
});
