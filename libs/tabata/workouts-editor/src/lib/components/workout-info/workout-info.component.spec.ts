import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { mockAuthFacade, mockModalController } from '@silver/tabata/testing';
import { WorkoutInfoComponent } from './workout-info.component';
import { ModalController } from '@ionic/angular/standalone';
import { AiWorkoutGenerationService } from '../../services/ai-workout-generation.service';
import { EMPTY } from 'rxjs';

const mockAiWorkoutGenerationService = {
    generateWorkout: jest.fn(() => EMPTY)
};

describe('WorkoutInfoComponent', () => {
    let component: WorkoutInfoComponent;
    let fixture: ComponentFixture<WorkoutInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutInfoComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: AiWorkoutGenerationService, useValue: mockAiWorkoutGenerationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutInfoComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('loadedInfo', {
            name: '',
            description: '',
            mainTargetBodypart: null,
            level: null,
            primaryGoal: null,
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit draftChange when form model changes', () => {
        const emitted: Partial<{ name?: string }>[] = [];
        component.draftChange.subscribe((v) => emitted.push(v));
        component.formModel.set({
            name: 'Test',
            description: 'Desc',
            mainTargetBodypart: 'Upper Body',
            level: 'beginner',
            primaryGoal: 'Cardio',
            availableEquipments: ['Bodyweight', 'Machine'],
            secondaryTargetBodyparts: ['Core'],
            generatedByAi: false
        });
        fixture.detectChanges();
        expect(emitted.some((e) => e.name === 'Test')).toBe(true);
    });

    it('should have invalid form when required fields are empty', () => {
        expect(component.isFormValid()).toBe(false);
    });

    it('should have valid form when name, description, main target, level and primary goal are set', () => {
        component.formModel.set({
            name: 'Workout',
            description: 'Description',
            mainTargetBodypart: 'Upper Body',
            level: 'beginner',
            primaryGoal: 'Strength',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(true);
    });

    it('should show Generate with AI when isCreateMode is true', () => {
        fixture.componentRef.setInput('isCreateMode', true);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('ion-button')?.textContent?.trim()).toContain('Generate with AI');
    });

    it('should not show Generate with AI when isCreateMode is false', () => {
        fixture.componentRef.setInput('isCreateMode', false);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).not.toContain('Generate with AI');
    });

    it('should clear touched state when loadedInfo is re-applied (e.g. Add workout after Save)', () => {
        component.infoForm.name().markAsTouched();
        fixture.detectChanges();
        expect(component.infoForm.name().touched()).toBe(true);

        fixture.componentRef.setInput('loadedInfo', {
            name: '',
            description: '',
            mainTargetBodypart: null,
            level: null,
            primaryGoal: null,
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();
        expect(component.infoForm.name().touched()).toBe(false);
    });
});
