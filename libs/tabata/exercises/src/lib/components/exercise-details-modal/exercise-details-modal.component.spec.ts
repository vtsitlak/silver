import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExerciseDetailsModalComponent } from './exercise-details-modal.component';
import { ModalController } from '@ionic/angular/standalone';
import { ExercisesFacade } from '@silver/tabata/states/exercises';

describe('ExerciseDetailsModalComponent', () => {
    let component: ExerciseDetailsModalComponent;
    let fixture: ComponentFixture<ExerciseDetailsModalComponent>;
    let dismissSpy: jest.Mock;
    let getExerciseByIdSpy: jest.Mock;
    let clearSelectedExerciseSpy: jest.Mock;

    beforeEach(async () => {
        dismissSpy = jest.fn().mockResolvedValue(undefined);
        getExerciseByIdSpy = jest.fn();
        clearSelectedExerciseSpy = jest.fn();
        await TestBed.configureTestingModule({
            imports: [ExerciseDetailsModalComponent],
            providers: [
                { provide: ModalController, useValue: { dismiss: dismissSpy } },
                {
                    provide: ExercisesFacade,
                    useValue: {
                        selectedExercise: signal(null),
                        isLoading: signal(false),
                        error: signal<string | null>(null),
                        getExerciseById: getExerciseByIdSpy,
                        clearSelectedExercise: clearSelectedExerciseSpy
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseDetailsModalComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('exerciseId', 'ex-1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load exercise by id on init', () => {
        expect(getExerciseByIdSpy).toHaveBeenCalledWith('ex-1');
    });

    it('should call ModalController.dismiss when onClose is called', () => {
        component.onClose();
        expect(dismissSpy).toHaveBeenCalled();
    });

    it('should clear selected exercise on destroy', () => {
        fixture.destroy();
        expect(clearSelectedExerciseSpy).toHaveBeenCalled();
    });
});
