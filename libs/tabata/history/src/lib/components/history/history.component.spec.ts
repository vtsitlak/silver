import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { HistoryComponent } from './history.component';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { mockAuthFacade, mockModalController, mockUserWorkoutsFacade, mockWorkoutsFacade } from '@silver/tabata/testing';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HistoryComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ModalController, useValue: mockModalController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to workout details when openWorkoutDetails is called', () => {
        const router = TestBed.inject(Router);
        const navSpy = jest.spyOn(router, 'navigate');
        component.openWorkoutDetails('w1');
        expect(navSpy).toHaveBeenCalledWith(['/tabs/workouts', 'w1']);
    });
});
