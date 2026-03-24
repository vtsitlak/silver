import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { WorkoutPlayerComponent } from './workout-player.component';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { ToastService } from '@silver/tabata/helpers';
import { ActionSheetController } from '@ionic/angular/standalone';
import {
    createMockActivatedRoute,
    createMockWorkoutsFacade,
    createMockExercisesFacade,
    mockAuthFacade,
    mockUserWorkoutsFacade,
    mockToastService,
    mockActionSheetController
} from '@silver/tabata/testing';

describe('WorkoutPlayerComponent', () => {
    let component: WorkoutPlayerComponent;
    let fixture: ComponentFixture<WorkoutPlayerComponent>;
    const mockWorkoutsFacade = createMockWorkoutsFacade();
    const mockExercisesFacade = createMockExercisesFacade();

    beforeEach(async () => {
        mockUserWorkoutsFacade.saveUserWorkout.mockReset();
        await TestBed.configureTestingModule({
            imports: [WorkoutPlayerComponent],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ paramMap: { get: (k: string) => (k === 'workoutId' ? 'w1' : null) } }) },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: AuthFacade, useValue: { ...mockAuthFacade, user: () => ({ uid: 'user1' }) } },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
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

    it('should create a fresh session on restart so replay can be recorded', () => {
        component.workoutId.set('w1');
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
});
