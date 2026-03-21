import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WorkoutEditorComponent } from './workout-editor.component';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { mockWorkoutEditorFacade, createMockWorkoutSubmitService, mockModalController } from '@silver/tabata/testing';
import { ModalController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';

const mockSubmitService = createMockWorkoutSubmitService();

describe('WorkoutEditorComponent', () => {
    let component: WorkoutEditorComponent;
    let fixture: ComponentFixture<WorkoutEditorComponent>;
    let router: Router;

    beforeEach(async () => {
        /** jsdom has no `scrollTo`; Ionic scrollable `ion-segment` uses it. */
        if (typeof Element.prototype.scrollTo !== 'function') {
            Element.prototype.scrollTo = jest.fn() as unknown as typeof Element.prototype.scrollTo;
        }

        await TestBed.configureTestingModule({
            imports: [WorkoutEditorComponent],
            providers: [
                provideRouter([]),
                { provide: WorkoutEditorFacade, useValue: mockWorkoutEditorFacade },
                {
                    provide: WorkoutsFacade,
                    useValue: {
                        isSaving: signal(false)
                    }
                },
                { provide: WorkoutSubmitService, useValue: mockSubmitService },
                { provide: ModalController, useValue: mockModalController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutEditorComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have info tab selected by default', () => {
        expect(component.selectedTab()).toBe('info');
    });

    it('should navigate to workouts on cancel (confirm runs in canDeactivate guard)', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/tabs/workouts']);
    });

    it('should change tab when onTabChange is called', () => {
        component.onTabChange('warmup');
        expect(component.selectedTab()).toBe('warmup');
    });

    it('should forward draft changes to the facade', () => {
        component.onDraftChange({ name: 'Test' });
        expect(mockWorkoutEditorFacade.updateDraft).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should clear draft when clear is requested', () => {
        component.onClearDraftRequested();
        expect(mockWorkoutEditorFacade.clearDraft).toHaveBeenCalled();
    });
});
