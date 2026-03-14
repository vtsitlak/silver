import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseSelectorModalComponent } from './exercise-selector-modal.component';
import { ExercisesFacade, Exercise } from '@silver/tabata/states/exercises';
import { ModalController } from '@ionic/angular/standalone';
import {
    mockExercisesArray,
    createMockExercisesFacadeForSelector,
    mockModalController
} from '@silver/tabata/testing';
import { ExerciseFilterService } from '../../services/exercise-filter.service';

const mockFacade = createMockExercisesFacadeForSelector(mockExercisesArray as Exercise[]);

describe('ExerciseSelectorModalComponent', () => {
    let component: ExerciseSelectorModalComponent;
    let fixture: ComponentFixture<ExerciseSelectorModalComponent>;
    let filterService: ExerciseFilterService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExerciseSelectorModalComponent],
            providers: [
                { provide: ExercisesFacade, useValue: mockFacade },
                { provide: ModalController, useValue: mockModalController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseSelectorModalComponent);
        component = fixture.componentInstance;
        filterService = TestBed.inject(ExerciseFilterService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with cancel role when cancel is called', () => {
        component.cancel();
        expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });

    it('should dismiss with selected exercises and confirm role on confirm', () => {
        component.toggleSelection(mockExercisesArray[0] as Exercise);
        component.confirm();
        expect(mockModalController.dismiss).toHaveBeenCalledWith(
            { selected: [mockExercisesArray[0]] },
            'confirm'
        );
    });

    it('should call dismiss when onDidDismiss is called (no-op, no error)', () => {
        expect(() => component.onDidDismiss()).not.toThrow();
    });

    it('should clear selections when resetSelections is called (no preselected)', () => {
        component.toggleSelection(mockExercises[0]);
        expect(component.selectedCount()).toBe(1);
        component.resetSelections();
        expect(component.selectedCount()).toBe(0);
    });

    it('should treat preselected exercises as disabled and exclude from count', () => {
        fixture.componentRef.setInput('preselectedIds', ['1']);
        fixture.detectChanges();
        component['initializePreselected']();
        expect(component.selectedCount()).toBe(1);
        expect(component.newlySelectedCount()).toBe(0);
        expect(component.isPreselected(mockExercisesArray[0] as Exercise)).toBe(true);
        component.confirm();
        expect(mockModalController.dismiss).toHaveBeenCalledWith({ selected: [] }, 'confirm');
    });

    it('should only return newly selected on confirm when preselected exist', () => {
        const ex2: Exercise = {
            ...mockExercises[0],
            exerciseId: '2',
            name: 'Squat'
        };
        mockFacade.exercises.set([mockExercises[0], ex2]);
        fixture.componentRef.setInput('preselectedIds', ['1']);
        fixture.detectChanges();
        component['initializePreselected']();
        component.toggleSelection(ex2);
        expect(component.newlySelectedCount()).toBe(1);
        component.confirm();
        expect(mockModalController.dismiss).toHaveBeenCalledWith({ selected: [ex2] }, 'confirm');
    });

    it('should not toggle preselected exercise', () => {
        fixture.componentRef.setInput('preselectedIds', ['1']);
        fixture.detectChanges();
        component['initializePreselected']();
        component.toggleSelection(mockExercises[0]);
        expect(component.selectedCount()).toBe(1);
        component.toggleSelection(mockExercises[0]);
        expect(component.selectedCount()).toBe(1);
    });

    it('resetSelections with preselected should keep only preselected', () => {
        const ex2: Exercise = { ...(mockExercisesArray[0] as Exercise), exerciseId: '2', name: 'Squat' };
        mockFacade.exercises.set([mockExercisesArray[0] as Exercise, ex2]);
        fixture.componentRef.setInput('preselectedIds', ['1']);
        fixture.detectChanges();
        component['initializePreselected']();
        component.toggleSelection(ex2);
        expect(component.selectedCount()).toBe(2);
        component.resetSelections();
        expect(component.selectedCount()).toBe(1);
        expect(component.isSelected(mockExercisesArray[0] as Exercise)).toBe(true);
        expect(component.isSelected(ex2)).toBe(false);
    });

    it('should support multiple muscle selection', () => {
        const spy = jest.spyOn(filterService, 'updateFilters');
        const event = { detail: { value: ['chest', 'back'] } } as unknown as CustomEvent<{ value: string | string[] }>;

        component.onMuscleChange(event);

        expect(component.selectedMuscles()).toEqual(['chest', 'back']);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ muscles: ['chest', 'back'] }));
    });

    it('should support multiple equipment selection', () => {
        const spy = jest.spyOn(filterService, 'updateFilters');
        const event = { detail: { value: ['barbell', 'dumbbell'] } } as unknown as CustomEvent<{ value: string | string[] }>;

        component.onEquipmentChange(event);

        expect(component.selectedEquipment()).toEqual(['barbell', 'dumbbell']);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ equipment: ['barbell', 'dumbbell'] }));
    });
});
