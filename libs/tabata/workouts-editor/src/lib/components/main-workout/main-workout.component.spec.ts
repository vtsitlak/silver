import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MainWorkoutComponent } from './main-workout.component';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { AuthFacade } from '@silver/tabata/auth';
import { ModalController } from '@ionic/angular/standalone';
import {
    createMockActivatedRoute,
    mockAuthFacade,
    mockWorkoutEditorFacade,
    createMockWorkoutEditorCancelService,
    createMockExercisesFacade,
    mockModalController
} from '@silver/tabata/testing';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';

const mockCancelService = createMockWorkoutEditorCancelService(true);
const mockExercisesFacade = createMockExercisesFacade();

describe('MainWorkoutComponent', () => {
    let component: MainWorkoutComponent;
    let fixture: ComponentFixture<MainWorkoutComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainWorkoutComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ paramMap: { get: (k: string) => (k === 'workoutId' ? 'w1' : null) } }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MainWorkoutComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with 0 blocks in create mode', () => {
        expect(component.blocks().length).toBe(0);
    });

    it('should navigate to cooldown on next when canGoNext', () => {
        component.blocks.set([
            {
                rounds: 8,
                workDurationSeconds: 20,
                restDurationSeconds: 10,
                exercise: {
                    exerciseId: 'e1',
                    name: 'Push',
                    images: [],
                    targetMuscles: [],
                    category: [],
                    equipments: [],
                    secondaryMuscles: [],
                    instructions: []
                },
                interBlockRestSeconds: 60
            }
        ]);
        component.onNext();
        expect(mockWorkoutEditorFacade.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ blocks: expect.any(Array) }));
        expect(router.navigate).toHaveBeenCalledWith(['/tabs/workouts/edit', 'w1', 'cooldown']);
    });

    it('should not navigate on next when canGoNext is false', () => {
        component.blocks.set([]);
        component.onNext();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
