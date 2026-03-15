import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { mockAuthFacade, mockModalController, mockUserWorkoutsFacade, mockWorkoutsFacade } from '@silver/tabata/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        mockAuthFacade.user.set(null);
        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ModalController, useValue: mockModalController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return empty string when user is null', () => {
        expect(component.greeting()).toBe('');
    });
    it('should return "there" when user has no displayName or email', () => {
        mockAuthFacade.user.set({});
        fixture.detectChanges();
        expect(component.greeting()).toBe('there');
    });

    it('should navigate to play route when playWorkout is called', () => {
        const router = TestBed.inject(Router);
        const navSpy = jest.spyOn(router, 'navigate');
        component.playWorkout('w1');
        expect(navSpy).toHaveBeenCalledWith(['/workouts', 'w1', 'play']);
    });
});
