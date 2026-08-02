import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutPlayerComponent } from './workout-player.component';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade, type UserWorkout, type UserWorkoutItem } from '@silver/tabata/states/user-workouts';
import { ToastService } from '@silver/tabata/helpers';
import { ActionSheetController } from '@ionic/angular/standalone';
import {
    createMockActivatedRoute,
    createMockWorkoutsFacade,
    createMockExercisesFacade,
    mockAuthFacade,
    mockToastService,
    mockActionSheetController,
    mockTabataWorkout
} from '@silver/tabata/testing';

describe('WorkoutPlayerComponent', () => {
    let component: WorkoutPlayerComponent;
    let fixture: ComponentFixture<WorkoutPlayerComponent>;
    let mockWorkoutsFacade: ReturnType<typeof createMockWorkoutsFacade>;
    const mockExercisesFacade = createMockExercisesFacade();
    let userWorkoutState: WritableSignal<UserWorkout | null>;
    let userWorkoutsFacade: {
        userWorkout: WritableSignal<UserWorkout | null>;
        isLoading: () => boolean;
        error: () => string | null;
        hasUserWorkout: () => boolean;
        loadUserWorkout: jest.Mock;
        saveUserWorkout: jest.Mock;
        getOrCreateUserWorkout: jest.Mock;
    };

    function setReadyWorkout(id = 'w1'): void {
        mockWorkoutsFacade.loadedWorkout.set({ ...mockTabataWorkout, id });
        mockWorkoutsFacade.isLoading.set(false);
        mockWorkoutsFacade.error.set(null);
        component.workoutId.set(id);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        mockWorkoutsFacade = createMockWorkoutsFacade();
        // Start with no loaded workout so the player cannot adopt a stale prior workout.
        mockWorkoutsFacade.loadedWorkout.set(null);
        userWorkoutState = signal<UserWorkout | null>(null);
        userWorkoutsFacade = {
            userWorkout: userWorkoutState,
            isLoading: () => false,
            error: () => null,
            hasUserWorkout: () => userWorkoutState() !== null,
            loadUserWorkout: jest.fn(),
            saveUserWorkout: jest.fn(),
            getOrCreateUserWorkout: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [WorkoutPlayerComponent],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ paramMap: { get: (k: string) => (k === 'workoutId' ? 'w1' : null) } }) },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: AuthFacade, useValue: { ...mockAuthFacade, user: () => ({ uid: 'user1' }) } },
                { provide: UserWorkoutsFacade, useValue: userWorkoutsFacade },
                { provide: ToastService, useValue: mockToastService },
                { provide: ActionSheetController, useValue: mockActionSheetController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('loads user workout data when opened from the direct player route', () => {
        // Arrange, Act, Assert
        expect(userWorkoutsFacade.getOrCreateUserWorkout).toHaveBeenCalledWith('user1');
    });

    it('should create a fresh session on restart so replay can be recorded', () => {
        setReadyWorkout('w1');
        component.segments.set([{ phase: 'warmup', label: 'Warmup', durationSeconds: 10, exerciseId: 'e1', isRest: false }]);
        component.currentSession.set({
            workoutId: 'w1',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '',
            completed: false
        });
        component.hasStarted.set(true);
        component.finished.set(true);
        component.isPlaying.set(false);

        component.restart();

        expect(component.finished()).toBe(false);
        expect(component.isPlaying()).toBe(true);
        expect(component.hasStarted()).toBe(true);
        expect(component.currentSession()).toEqual(
            expect.objectContaining({
                workoutId: 'w1',
                finishedAt: '',
                completed: false
            })
        );
    });

    it('preserves existing favorites and history when persisting a completed session', () => {
        // Arrange
        const existingItem: UserWorkoutItem = {
            workoutId: 'old-workout',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '2026-01-01T00:10:00.000Z',
            completed: true
        };
        userWorkoutState.set({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [existingItem]
        });
        setReadyWorkout('w1');
        component.segments.set([{ phase: 'warmup', label: 'Warmup', durationSeconds: 10, exerciseId: 'e1', isRest: false }]);
        component.currentSession.set({
            workoutId: 'w1',
            startedAt: '2026-01-02T00:00:00.000Z',
            finishedAt: '',
            completed: false
        });

        // Act
        component.skip();

        // Assert
        expect(userWorkoutsFacade.saveUserWorkout).toHaveBeenCalledWith({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [
                existingItem,
                expect.objectContaining({
                    workoutId: 'w1',
                    startedAt: '2026-01-02T00:00:00.000Z',
                    completed: true
                })
            ]
        });
    });

    it('waits for user workout hydration before saving a completed session', async () => {
        // Arrange
        const existingItem: UserWorkoutItem = {
            workoutId: 'old-workout',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '2026-01-01T00:10:00.000Z',
            completed: true
        };
        setReadyWorkout('w1');
        component.segments.set([{ phase: 'warmup', label: 'Warmup', durationSeconds: 10, exerciseId: 'e1', isRest: false }]);
        component.currentSession.set({
            workoutId: 'w1',
            startedAt: '2026-01-02T00:00:00.000Z',
            finishedAt: '',
            completed: false
        });
        userWorkoutsFacade.getOrCreateUserWorkout.mockClear();

        // Act
        component.skip();

        // Assert
        expect(userWorkoutsFacade.saveUserWorkout).not.toHaveBeenCalled();
        expect(userWorkoutsFacade.getOrCreateUserWorkout).toHaveBeenCalledWith('user1');

        // Act
        userWorkoutState.set({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [existingItem]
        });
        fixture.detectChanges();
        await fixture.whenStable();

        // Assert
        expect(userWorkoutsFacade.saveUserWorkout).toHaveBeenCalledWith({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [
                existingItem,
                expect.objectContaining({
                    workoutId: 'w1',
                    startedAt: '2026-01-02T00:00:00.000Z',
                    completed: true
                })
            ]
        });
        expect(component.currentSession()).toBeNull();
    });

    it('waits to leave the finished player until a pending session is saved', async () => {
        // Arrange
        const router = TestBed.inject(Router);
        const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
        const existingItem: UserWorkoutItem = {
            workoutId: 'old-workout',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '2026-01-01T00:10:00.000Z',
            completed: true
        };
        setReadyWorkout('w1');
        component.segments.set([{ phase: 'warmup', label: 'Warmup', durationSeconds: 10, exerciseId: 'e1', isRest: false }]);
        component.currentSession.set({
            workoutId: 'w1',
            startedAt: '2026-01-02T00:00:00.000Z',
            finishedAt: '',
            completed: false
        });
        userWorkoutsFacade.getOrCreateUserWorkout.mockClear();
        component.skip();

        // Act
        await component.cancel();

        // Assert
        expect(navigateSpy).not.toHaveBeenCalled();
        expect(userWorkoutsFacade.saveUserWorkout).not.toHaveBeenCalled();
        expect(userWorkoutsFacade.getOrCreateUserWorkout).toHaveBeenCalledWith('user1');

        // Act
        userWorkoutState.set({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [existingItem]
        });
        fixture.detectChanges();
        await fixture.whenStable();

        // Assert
        expect(userWorkoutsFacade.saveUserWorkout).toHaveBeenCalledWith({
            userId: 'user1',
            favoriteWorkouts: ['favorite-workout'],
            workoutItems: [
                existingItem,
                expect.objectContaining({
                    workoutId: 'w1',
                    startedAt: '2026-01-02T00:00:00.000Z',
                    completed: true
                })
            ]
        });
        expect(navigateSpy).toHaveBeenCalledWith(['/tabs/workouts']);
    });

    it('does not build segments or start a session from a stale previously loaded workout', () => {
        // Arrange — store still holds workout A while the route asks for workout B
        mockWorkoutsFacade.loadedWorkout.set({ ...mockTabataWorkout, id: 'workout-a', name: 'Workout A' });
        mockWorkoutsFacade.isLoading.set(false);
        component.workoutId.set('workout-b');
        fixture.detectChanges();

        // Act
        component.togglePlay();

        // Assert
        expect(component.isWorkoutReady()).toBe(false);
        expect(component.segments()).toEqual([]);
        expect(component.hasStarted()).toBe(false);
        expect(component.currentSession()).toBeNull();
        expect(component.isPlaying()).toBe(false);
    });

    it('clears stale segments when the requested workout load resolves to null', () => {
        // Arrange — briefly adopt a matching workout, then simulate not-found
        setReadyWorkout('w1');
        expect(component.segments().length).toBeGreaterThan(0);

        // Act
        mockWorkoutsFacade.loadedWorkout.set(null);
        mockWorkoutsFacade.error.set('Workout not found');
        fixture.detectChanges();

        // Assert
        expect(component.isWorkoutReady()).toBe(false);
        expect(component.segments()).toEqual([]);
        expect(component.currentSession()).toBeNull();
    });
});
