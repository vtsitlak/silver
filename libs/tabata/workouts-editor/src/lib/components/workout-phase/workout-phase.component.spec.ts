import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { createMockActivatedRoute, mockAuthFacade, mockModalController, mockWorkoutEditorFacade } from '@silver/tabata/testing';
import { WorkoutPhaseComponent } from './workout-phase.component';

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
                { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade }
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
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'warmup' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade }
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
                { provide: ActivatedRoute, useValue: createMockActivatedRoute({ routeConfig: { path: 'cooldown' } }) },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade }
            ]
        }).compileComponents();
        const f = TestBed.createComponent(WorkoutPhaseComponent);
        f.detectChanges();
        expect(f.componentInstance.phaseType()).toBe('cooldown');
    });

    it('should navigate to workouts on cancel', () => {
        const navSpy = jest.spyOn(router, 'navigate');
        component.onCancel();
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts']);
    });
});
