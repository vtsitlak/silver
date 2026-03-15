import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiWorkoutPreviewModalComponent } from './ai-workout-preview-modal.component';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { ToastService } from '@silver/tabata/helpers';
import { ModalController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';
import { of } from 'rxjs';

const mockDraft = {
    name: 'AI Core',
    description: 'Core focus',
    totalDurationMinutes: 20,
    warmup: {
        totalDurationSeconds: 180,
        movements: [
            { exerciseId: 'ex1', durationSeconds: 60 },
            { exerciseId: 'ex2', durationSeconds: 60 }
        ]
    },
    blocks: [
        {
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'ex3',
            interBlockRestSeconds: 60
        }
    ],
    cooldown: {
        totalDurationSeconds: 120,
        movements: [{ exerciseId: 'ex1', durationSeconds: 60 }]
    },
    generatedByAi: true
};

describe('AiWorkoutPreviewModalComponent', () => {
    let component: AiWorkoutPreviewModalComponent;
    let fixture: ComponentFixture<AiWorkoutPreviewModalComponent>;
    let mockFacade: { workoutDraft: ReturnType<typeof signal>; isSaving: ReturnType<typeof signal> };
    let mockSubmitService: { submitWorkout: jest.Mock };
    let mockExercisesFacade: { exercisesMap: ReturnType<typeof signal>; loadExercisesMap: jest.Mock };
    let mockToast: { showError: jest.Mock };
    let mockModalCtrl: { dismiss: jest.Mock };

    beforeEach(async () => {
        mockFacade = {
            workoutDraft: signal(mockDraft),
            isSaving: signal(false)
        };
        mockSubmitService = { submitWorkout: jest.fn(() => of({ id: 'w1', ...mockDraft })) };
        mockExercisesFacade = {
            exercisesMap: signal({ ex1: { name: 'Ex 1', images: [] }, ex2: { name: 'Ex 2', images: [] }, ex3: { name: 'Ex 3', images: [] } }),
            loadExercisesMap: jest.fn()
        };
        mockToast = { showError: jest.fn() };
        mockModalCtrl = { dismiss: jest.fn().mockResolvedValue(undefined) };

        await TestBed.configureTestingModule({
            imports: [AiWorkoutPreviewModalComponent],
            providers: [
                { provide: WorkoutEditorFacade, useValue: mockFacade },
                { provide: WorkoutSubmitService, useValue: mockSubmitService },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ToastService, useValue: mockToast },
                { provide: ModalController, useValue: mockModalCtrl }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AiWorkoutPreviewModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should resolve exercise name from map', () => {
        expect(component.getExerciseName('ex1')).toBe('Ex 1');
        expect(component.getExerciseName('unknown')).toBe('unknown');
    });

    it('should call loadExercisesMap with draft exercise ids', () => {
        expect(mockExercisesFacade.loadExercisesMap).toHaveBeenCalled();
        const ids = mockExercisesFacade.loadExercisesMap.mock.calls[0][0] as string[];
        expect(ids).toHaveLength(3);
        expect(ids).toContain('ex1');
        expect(ids).toContain('ex2');
        expect(ids).toContain('ex3');
    });

    it('should dismiss with save role when save succeeds', () => {
        component.onSave();
        expect(mockSubmitService.submitWorkout).toHaveBeenCalled();
        expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(expect.objectContaining({ workout: expect.objectContaining({ id: 'w1' }) }), 'save');
    });

    it('should dismiss with tryAgain role when try again is clicked', () => {
        component.onTryAgain();
        expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'tryAgain');
    });

    it('should dismiss with cancel role when cancel is clicked', () => {
        component.onCancel();
        expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });
});
