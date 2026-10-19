import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '@silver/tabata/auth';
import { mockActionSheetController, mockAuthFacade, mockWorkoutEditorFacade } from '@silver/tabata/testing';
import { WorkoutInfoComponent } from './workout-info.component';
import { ActionSheetController } from '@ionic/angular/standalone';
import { AiWorkoutGenerationService } from '../../services/ai-workout-generation.service';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { EMPTY, of, Subject, type Subscription } from 'rxjs';
import type { GenerateWorkoutOutput } from '@silver/tabata/ai-workout-generator';

const mockAiWorkoutGenerationService = {
    generateWorkout: jest.fn(() => EMPTY)
};

const mockGenerated: GenerateWorkoutOutput = {
    totalDurationMinutes: 20,
    warmup: { totalDurationSeconds: 60, movements: [{ exerciseId: 'wu1', durationSeconds: 60 }] },
    blocks: [
        {
            rounds: 4,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'b1',
            interBlockRestSeconds: 60
        }
    ],
    cooldown: { totalDurationSeconds: 60, movements: [{ exerciseId: 'cd1', durationSeconds: 60 }] }
};

describe('WorkoutInfoComponent', () => {
    let component: WorkoutInfoComponent;
    let fixture: ComponentFixture<WorkoutInfoComponent>;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockAiWorkoutGenerationService.generateWorkout.mockReturnValue(EMPTY);
        await TestBed.configureTestingModule({
            imports: [WorkoutInfoComponent],
            providers: [
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: ActionSheetController, useValue: mockActionSheetController },
                { provide: AiWorkoutGenerationService, useValue: mockAiWorkoutGenerationService },
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade }
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

    it('should keep info fields when loadedInfo is re-applied after AI lock snapshot sync', () => {
        component.formModel.set({
            name: 'AI Core',
            description: 'Core focus',
            mainTargetBodypart: 'Core',
            level: 'beginner',
            primaryGoal: 'Cardio',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();

        const emitted: Array<{ name?: string; description?: string; generatedByAi?: boolean }> = [];
        component.draftChange.subscribe((v) => emitted.push(v));

        fixture.componentRef.setInput('loadedInfo', {
            name: 'AI Core',
            description: 'Core focus',
            mainTargetBodypart: 'Core',
            level: 'beginner',
            primaryGoal: 'Cardio',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: true
        });
        fixture.detectChanges();

        const last = emitted[emitted.length - 1];
        expect(last?.name).toBe('AI Core');
        expect(last?.description).toBe('Core focus');
        expect(last?.generatedByAi).toBe(true);
    });

    it('should pin AI structure, clear the lock for tab edits, and open the success action sheet', async () => {
        mockAiWorkoutGenerationService.generateWorkout.mockReturnValue(of(mockGenerated));
        const present = jest.fn().mockResolvedValue(undefined);
        (mockActionSheetController.create as jest.Mock).mockResolvedValue({
            present,
            onDidDismiss: jest.fn().mockResolvedValue({ role: 'cancel', data: undefined })
        });

        component.formModel.set({
            name: 'AI Core',
            description: 'Core focus',
            mainTargetBodypart: 'Core',
            level: 'beginner',
            primaryGoal: 'Cardio',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();

        component.onGenerateWithAi();
        await fixture.whenStable();

        expect(mockWorkoutEditorFacade.lockAiGeneratedStructure).toHaveBeenCalledWith(mockGenerated);
        expect(mockWorkoutEditorFacade.clearAiStructureLock).toHaveBeenCalled();
        expect(mockActionSheetController.create).toHaveBeenCalledWith({
            header: 'Workout generated successfully',
            subHeader: 'You can navigate to the workout tabs to edit and save the workout.',
            cssClass: 'tbt-action-sheet-visible',
            buttons: [{ text: 'Got it', role: 'cancel' }]
        });
        expect(present).toHaveBeenCalled();
        expect(component.formModel().generatedByAi).toBe(true);
        expect(mockWorkoutEditorFacade.clearDraft).not.toHaveBeenCalled();
        expect(mockWorkoutEditorFacade.trackAiGeneration).toHaveBeenCalled();
    });

    it('should not apply AI structure when generation is cancelled before the result arrives', () => {
        const pending = new Subject<GenerateWorkoutOutput>();
        mockAiWorkoutGenerationService.generateWorkout.mockReturnValue(pending.asObservable());

        component.formModel.set({
            name: 'AI Core',
            description: 'Core focus',
            mainTargetBodypart: 'Core',
            level: 'beginner',
            primaryGoal: 'Cardio',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();

        component.onGenerateWithAi();
        expect(component.isGenerating()).toBe(true);

        const tracked = mockWorkoutEditorFacade.trackAiGeneration.mock.calls.at(-1)?.[0] as Subscription;
        tracked.unsubscribe();
        pending.next(mockGenerated);

        expect(mockWorkoutEditorFacade.lockAiGeneratedStructure).not.toHaveBeenCalled();
        expect(mockActionSheetController.create).not.toHaveBeenCalled();
        expect(component.isGenerating()).toBe(false);
        expect(component.formModel().generatedByAi).toBe(false);
    });
});
