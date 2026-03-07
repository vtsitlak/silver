import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ExerciseDetailsComponent } from './exercise-details.component';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';

const mockExercise: Exercise = {
    exerciseId: '1',
    name: 'Push Up',
    gifUrl: 'https://example.com/pushup.gif',
    targetMuscles: ['chest', 'triceps'],
    bodyParts: ['upper body'],
    equipments: ['body weight'],
    secondaryMuscles: ['shoulders', 'core'],
    instructions: ['Start in plank position', 'Lower your body', 'Push back up']
};

const mockExercisesFacade = {
    selectedExercise: signal<Exercise | null>(mockExercise),
    isLoading: signal(false),
    error: signal<string | null>(null),
    getExerciseById: jest.fn(),
    clearSelectedExercise: jest.fn()
};

describe('ExerciseDetailsComponent', () => {
    let component: ExerciseDetailsComponent;
    let fixture: ComponentFixture<ExerciseDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExerciseDetailsComponent],
            providers: [provideRouter([]), { provide: ExercisesFacade, useValue: mockExercisesFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseDetailsComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('exerciseId', '1');
        fixture.detectChanges();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load exercise on init', () => {
        expect(mockExercisesFacade.getExerciseById).toHaveBeenCalledWith('1');
    });

    it('should clear selected exercise on destroy', () => {
        component.ngOnDestroy();
        expect(mockExercisesFacade.clearSelectedExercise).toHaveBeenCalled();
    });

    it('should format muscle name correctly', () => {
        expect(component.formatMuscle('upper body')).toBe('Upper Body');
        expect(component.formatMuscle('triceps')).toBe('Triceps');
    });

    it('should display exercise data', () => {
        expect(component.exercise()?.name).toBe('Push Up');
        expect(component.exercise()?.targetMuscles).toContain('chest');
    });
});
