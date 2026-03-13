import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { createMockActivatedRoute, mockAuthFacade, mockWorkoutEditorFacade } from '@silver/tabata/testing';
import { WorkoutInfoComponent } from './workout-info.component';
import { WorkoutEditorCancelService } from '../../services/workout-editor-cancel.service';

const mockCancelService = {
    confirmCancel: jest.fn().mockResolvedValue(false)
};

describe('WorkoutInfoComponent', () => {
    let component: WorkoutInfoComponent;
    let fixture: ComponentFixture<WorkoutInfoComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutInfoComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                { provide: WorkoutEditorCancelService, useValue: mockCancelService },
                { provide: AuthFacade, useValue: mockAuthFacade },
                {
                    provide: ActivatedRoute,
                    useValue: createMockActivatedRoute()
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutInfoComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update draft when form model changes', () => {
        const spy = jest.spyOn(mockWorkoutEditorFacade, 'updateDraft');
        component.infoModel.set({
            name: 'Test',
            description: 'Desc',
            mainTargetBodypart: 'Upper Body',
            availableEquipments: ['Machine'],
            secondaryTargetBodyparts: ['Core'],
            generatedByAi: false
        });
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test',
                description: 'Desc',
                mainTargetBodypart: 'Upper Body',
                availableEquipments: ['Machine'],
                secondaryTargetBodyparts: ['Core']
            })
        );
    });

    it('should navigate to warmup on submit when form is valid', () => {
        const navSpy = jest.spyOn(router, 'navigate');
        component.infoModel.set({
            name: 'Workout',
            description: 'Description',
            mainTargetBodypart: 'Upper Body',
            availableEquipments: [],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();
        component.onSubmit();
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts/create/warmup']);
    });

    it('should not navigate when form is invalid on submit', () => {
        const navSpy = jest.spyOn(router, 'navigate');
        component.infoModel.set({
            name: '',
            description: '',
            mainTargetBodypart: null,
            availableEquipments: [],
            secondaryTargetBodyparts: [],
            generatedByAi: false
        });
        fixture.detectChanges();
        component.onSubmit();
        expect(navSpy).not.toHaveBeenCalled();
    });

    it('should navigate to workouts when confirmCancel returns false', async () => {
        const navSpy = jest.spyOn(router, 'navigate');
        mockCancelService.confirmCancel.mockResolvedValue(false);
        await component.onCancel();
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts']);
    });

    it('should have invalid form when required fields are empty', () => {
        expect(component.isFormValid()).toBe(false);
    });

    it('should have valid form when name, description and main target are set', () => {
        component.infoModel.set({
            name: 'Workout',
            description: 'Description',
            mainTargetBodypart: 'Upper Body',
            availableEquipments: [],
            secondaryTargetBodyparts: []
        });
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(true);
    });
});
