import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { createMockActivatedRoute, mockAuthFacade, mockWorkoutEditorFacade } from '@silver/tabata/testing';
import { WorkoutInfoComponent } from './workout-info.component';

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

    it('should save draft only when Next (submit) is called', () => {
        const spy = jest.spyOn(mockWorkoutEditorFacade, 'updateDraft');
        component.infoModel.set({
            name: 'Test',
            description: 'Desc',
            mainTargetBodypart: 'Upper Body',
            availableEquipments: ['Machine'],
            secondaryTargetBodyparts: ['Core']
        });
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
        component.onSubmit();
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

    it('should not save draft when form is invalid on submit', () => {
        const spy = jest.spyOn(mockWorkoutEditorFacade, 'updateDraft');
        spy.mockClear();
        component.infoModel.set({
            name: '',
            description: '',
            mainTargetBodypart: null,
            availableEquipments: [],
            secondaryTargetBodyparts: []
        });
        fixture.detectChanges();
        component.onSubmit();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should clear draft and navigate on cancel', () => {
        const clearSpy = jest.spyOn(mockWorkoutEditorFacade, 'clearDraft');
        const navSpy = jest.spyOn(router, 'navigate');
        component.onCancel();
        expect(clearSpy).toHaveBeenCalled();
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
