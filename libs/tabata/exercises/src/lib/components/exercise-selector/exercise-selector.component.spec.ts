import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExerciseSelectorComponent } from './exercise-selector.component';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';

const mockExercises: Exercise[] = [
    {
        exerciseId: '1',
        name: 'Push Up',
        gifUrl: 'https://example.com/pushup.gif',
        targetMuscles: ['chest'],
        bodyParts: ['upper body'],
        equipments: ['body weight'],
        secondaryMuscles: ['triceps'],
        instructions: []
    },
    {
        exerciseId: '2',
        name: 'Squat',
        gifUrl: 'https://example.com/squat.gif',
        targetMuscles: ['quadriceps'],
        bodyParts: ['lower body'],
        equipments: ['body weight'],
        secondaryMuscles: ['glutes'],
        instructions: []
    }
];

const mockExercisesFacade = {
    exercises: signal(mockExercises),
    isLoading: signal(false),
    error: signal<string | null>(null),
    musclesList: signal(['chest', 'quadriceps', 'triceps']),
    equipmentList: signal(['body weight', 'barbell']),
    bodyPartList: signal(['upper body', 'lower body']),
    getAllExercises: jest.fn(),
    getMusclesList: jest.fn(),
    getEquipmentList: jest.fn(),
    getBodyPartList: jest.fn()
};

describe('ExerciseSelectorComponent', () => {
    let component: ExerciseSelectorComponent;
    let fixture: ComponentFixture<ExerciseSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExerciseSelectorComponent],
            providers: [{ provide: ExercisesFacade, useValue: mockExercisesFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load exercises on init', () => {
        expect(mockExercisesFacade.getAllExercises).toHaveBeenCalled();
    });

    it('should load filter options on init', () => {
        expect(mockExercisesFacade.getMusclesList).toHaveBeenCalled();
        expect(mockExercisesFacade.getEquipmentList).toHaveBeenCalled();
        expect(mockExercisesFacade.getBodyPartList).toHaveBeenCalled();
    });

    it('should toggle selection in single mode', () => {
        const exercise = mockExercises[0];
        component.toggleSelection(exercise);
        expect(component.isSelected(exercise)).toBe(true);

        component.toggleSelection(exercise);
        expect(component.isSelected(exercise)).toBe(false);
    });

    it('should clear previous selection in single mode', () => {
        const exercise1 = mockExercises[0];
        const exercise2 = mockExercises[1];

        component.toggleSelection(exercise1);
        expect(component.isSelected(exercise1)).toBe(true);

        component.toggleSelection(exercise2);
        expect(component.isSelected(exercise1)).toBe(false);
        expect(component.isSelected(exercise2)).toBe(true);
    });

    it('should allow multiple selections in multiple mode', () => {
        fixture.componentRef.setInput('multiple', true);
        fixture.detectChanges();

        const exercise1 = mockExercises[0];
        const exercise2 = mockExercises[1];

        component.toggleSelection(exercise1);
        component.toggleSelection(exercise2);

        expect(component.isSelected(exercise1)).toBe(true);
        expect(component.isSelected(exercise2)).toBe(true);
        expect(component.selectedCount()).toBe(2);
    });

    it('should respect max selection limit', () => {
        fixture.componentRef.setInput('multiple', true);
        fixture.componentRef.setInput('maxSelection', 1);
        fixture.detectChanges();

        const exercise1 = mockExercises[0];
        const exercise2 = mockExercises[1];

        component.toggleSelection(exercise1);
        expect(component.canSelectMore()).toBe(false);

        component.toggleSelection(exercise2);
        expect(component.isSelected(exercise2)).toBe(false);
    });

    it('should emit selectionConfirmed on confirm', () => {
        const emitSpy = jest.spyOn(component.selectionConfirmed, 'emit');
        const exercise = mockExercises[0];

        component.toggleSelection(exercise);
        component.confirm();

        expect(emitSpy).toHaveBeenCalledWith([exercise]);
    });

    it('should emit selectionCancelled on cancel', () => {
        const emitSpy = jest.spyOn(component.selectionCancelled, 'emit');
        component.cancel();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('should format name correctly', () => {
        expect(component.formatName('body weight')).toBe('Body Weight');
        expect(component.formatName('chest')).toBe('Chest');
    });

    it('should filter exercises by search term', () => {
        component.searchTerm.set('push');
        const filtered = component.filteredExercises();
        expect(filtered.length).toBe(1);
        expect(filtered[0].name).toBe('Push Up');
    });

    it('should clear filters', () => {
        component.selectedMuscle.set('chest');
        component.selectedEquipment.set('barbell');
        component.searchTerm.set('test');

        component.clearFilters();

        expect(component.selectedMuscle()).toBeNull();
        expect(component.selectedEquipment()).toBeNull();
        expect(component.searchTerm()).toBe('');
    });
});
