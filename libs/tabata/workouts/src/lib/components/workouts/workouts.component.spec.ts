import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { ToastService } from '@silver/tabata/helpers';
import { mockAuthFacade, mockWorkoutsFacade, mockModalController, mockToastService } from '@silver/tabata/testing';
import { WorkoutsComponent } from './workouts.component';
import { ModalController } from '@ionic/angular/standalone';

describe('WorkoutsComponent', () => {
    let component: WorkoutsComponent;
    let fixture: ComponentFixture<WorkoutsComponent>;

    beforeEach(async () => {
        mockWorkoutsFacade.removeWorkout.mockReturnValue(of({ success: true }));
        await TestBed.configureTestingModule({
            imports: [WorkoutsComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: ToastService, useValue: mockToastService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
