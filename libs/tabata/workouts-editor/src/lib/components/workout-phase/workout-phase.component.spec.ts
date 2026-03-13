import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { createMockActivatedRoute, mockAuthFacade, mockModalController, mockWorkoutEditorFacade } from '@silver/tabata/testing';
import { WorkoutPhaseComponent } from './workout-phase.component';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

const mockCancelService = {
    confirmCancel: jest.fn().mockResolvedValue(false)
};

const mockExercisesFacade = {
    exercisesMap: () => ({}),
    loadExercisesMap: jest.fn()
};

const mockWorkoutSubmitService = {
    submitWorkout: () => of({} as TabataWorkout)
};

describe('WorkoutPhaseComponent', () => {
    let component: WorkoutPhaseComponent;
    let fixture: ComponentFixture<WorkoutPhaseComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutSubmitService, useValue: mockWorkoutSubmitService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutPhaseComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set phase to warmup when last url segment is warmup', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'warmup' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutSubmitService, useValue: mockWorkoutSubmitService }
            ]
        }).compileComponents();
        const f = TestBed.createComponent(WorkoutPhaseComponent);
        f.detectChanges();
        expect(f.componentInstance.phaseType()).toBe('warmup');
    });

    it('should set phase to cooldown when last url segment is cooldown', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'cooldown' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutSubmitService, useValue: mockWorkoutSubmitService }
            ]
        }).compileComponents();
        const f = TestBed.createComponent(WorkoutPhaseComponent);
        f.detectChanges();
        expect(f.componentInstance.phaseType()).toBe('cooldown');
    });

    it('should navigate to workouts on cancel when confirmCancel returns false', async () => {
        const navSpy = jest.spyOn(router, 'navigate');
        mockCancelService.confirmCancel.mockResolvedValue(false);
        await component.onCancel();
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts']);
    });

    it('should show Finish button label on cooldown', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'cooldown' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutSubmitService, useValue: mockWorkoutSubmitService }
            ]
        }).compileComponents();
        const f = TestBed.createComponent(WorkoutPhaseComponent);
        f.detectChanges();
        expect(f.componentInstance.nextButtonLabel()).toBe('Finish');
    });

    it('should call submitWorkout and navigate to workouts when finishing cooldown', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'cooldown' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutSubmitService, useValue: mockWorkoutSubmitService }
            ]
        }).compileComponents();
        const f = TestBed.createComponent(WorkoutPhaseComponent);
        const comp = f.componentInstance;
        const routerFromTestBed = TestBed.inject(Router);
        const navSpy = jest.spyOn(routerFromTestBed, 'navigate');
        const submitSpy = jest.spyOn(mockWorkoutSubmitService, 'submitWorkout');
        comp.phaseItems.set([
            {
                exercise: {
                    exerciseId: 'e1',
                    name: 'Stretch',
                    images: [],
                    targetMuscles: [],
                    bodyParts: [],
                    equipments: [],
                    secondaryMuscles: [],
                    instructions: []
                },
                durationSeconds: 60
            }
        ]);
        f.detectChanges();
        comp.onNext();
        expect(submitSpy).toHaveBeenCalled();
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts']);
    });

    it('should reorder phase items on ionReorderEnd and update duration modal index', () => {
        const items = [
            {
                exercise: { exerciseId: 'a', name: 'A', images: [], targetMuscles: [], bodyParts: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 30
            },
            {
                exercise: { exerciseId: 'b', name: 'B', images: [], targetMuscles: [], bodyParts: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 45
            },
            {
                exercise: { exerciseId: 'c', name: 'C', images: [], targetMuscles: [], bodyParts: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 60
            }
        ];
        component.phaseItems.set([...items]);
        fixture.detectChanges();
        const completeSpy = jest.fn();
        component.handleReorderEnd({
            detail: { from: 2, to: 0, complete: completeSpy },
            preventDefault: jest.fn()
        } as unknown as CustomEvent<{ from: number; to: number; complete: (data?: boolean | unknown[]) => void }>);
        expect(component.phaseItems().map((p) => p.exercise.exerciseId)).toEqual(['c', 'a', 'b']);
        expect(completeSpy).toHaveBeenCalledWith(true);
    });
});
