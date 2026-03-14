import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { WorkoutPlayerComponent } from './workout-player.component';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { ToastService } from '@silver/tabata/helpers';
import { ActionSheetController } from '@ionic/angular/standalone';
import { createMockActivatedRoute, createMockWorkoutsFacade, createMockExercisesFacade } from '@silver/tabata/testing';

describe('WorkoutPlayerComponent', () => {
    let component: WorkoutPlayerComponent;
    let fixture: ComponentFixture<WorkoutPlayerComponent>;
    const mockWorkoutsFacade = createMockWorkoutsFacade();
    const mockExercisesFacade = createMockExercisesFacade();
    const mockToastService = { showError: jest.fn() };
    const mockActionSheetController = {
        create: jest.fn().mockResolvedValue({
            present: jest.fn(),
            onDidDismiss: jest.fn().mockResolvedValue({ data: undefined })
        })
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutPlayerComponent],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ paramMap: { get: (k: string) => (k === 'workoutId' ? 'w1' : null) } }) },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
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
});
