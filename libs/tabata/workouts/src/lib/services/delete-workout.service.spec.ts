import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { DeleteWorkoutService } from './delete-workout.service';

describe('DeleteWorkoutService', () => {
    const mockAuthFacade = {
        user: signal<{ uid?: string } | null>(null)
    };
    const userWorkoutSignal = signal<{
        userId: string;
        favoriteWorkouts: string[];
        workoutItems: { workoutId: string; completed: boolean; startedAt: string; finishedAt: string }[];
    } | null>(null);
    const mockUserWorkoutsFacade = {
        userWorkout: userWorkoutSignal,
        saveUserWorkout: jest.fn()
    };
    const mockWorkoutsFacade = {
        removeWorkout: jest.fn(() => of({ success: true }))
    };

    let service: DeleteWorkoutService;

    beforeEach(async () => {
        mockAuthFacade.user.set(null);
        userWorkoutSignal.set(null);
        mockUserWorkoutsFacade.saveUserWorkout.mockReset();
        mockWorkoutsFacade.removeWorkout.mockReset();
        mockWorkoutsFacade.removeWorkout.mockReturnValue(of({ success: true }));

        await TestBed.configureTestingModule({
            providers: [
                DeleteWorkoutService,
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade }
            ]
        }).compileComponents();

        service = TestBed.inject(DeleteWorkoutService);
    });

    it('should delete workout and remove references from current userWorkout', (done) => {
        mockAuthFacade.user.set({ uid: 'user-1' });
        userWorkoutSignal.set({
            userId: 'user-1',
            favoriteWorkouts: ['w1', 'w2'],
            workoutItems: [
                { workoutId: 'w1', completed: true, startedAt: '2026-01-01', finishedAt: '2026-01-01' },
                { workoutId: 'w2', completed: false, startedAt: '2026-01-02', finishedAt: '2026-01-02' }
            ]
        });

        service.deleteWorkoutAndCleanup('w1').subscribe({
            next: (res) => {
                expect(res).toEqual({ success: true });
                expect(mockWorkoutsFacade.removeWorkout).toHaveBeenCalledWith('w1');
                expect(mockUserWorkoutsFacade.saveUserWorkout).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: 'user-1',
                        favoriteWorkouts: ['w2'],
                        workoutItems: [{ workoutId: 'w2', completed: false, startedAt: '2026-01-02', finishedAt: '2026-01-02' }]
                    })
                );
                done();
            },
            error: done
        });
    });

    it('should not update userWorkout when workout delete fails', (done) => {
        mockAuthFacade.user.set({ uid: 'user-1' });
        userWorkoutSignal.set({
            userId: 'user-1',
            favoriteWorkouts: ['w1'],
            workoutItems: [{ workoutId: 'w1', completed: true, startedAt: '2026-01-01', finishedAt: '2026-01-01' }]
        });
        mockWorkoutsFacade.removeWorkout.mockReturnValueOnce(of({ success: false }));

        service.deleteWorkoutAndCleanup('w1').subscribe({
            next: (res) => {
                expect(res).toEqual({ success: false });
                expect(mockUserWorkoutsFacade.saveUserWorkout).not.toHaveBeenCalled();
                done();
            },
            error: done
        });
    });
});
