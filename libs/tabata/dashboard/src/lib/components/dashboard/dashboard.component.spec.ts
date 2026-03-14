import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { DashboardComponent } from './dashboard.component';

const mockAuthFacade = {
    user: () => null,
    error: () => null,
    isLoading: () => false,
    isAuthenticated: () => false,
    usePassword: () => true,
    useGoogle: () => false,
    hasError: () => false,
    sign: () => {},
    register: () => {},
    sendPasswordResetEmail: () => {},
    updateDisplayName: () => {},
    updatePassword: () => {},
    logout: () => {},
    getUser: () => {}
};

const mockUserWorkoutsFacade = {
    userWorkout: () => null,
    isLoading: () => false,
    error: () => null,
    getOrCreateUserWorkout: () => {},
    saveUserWorkout: () => {}
};

const mockWorkoutsFacade = {
    workouts: () => [],
    loadWorkouts: () => {},
    loadWorkoutById: () => {}
};

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return greeting from user displayName or email', () => {
        expect(component.greeting()).toBe('there');
    });

    it('should navigate to play route when playWorkout is called', () => {
        const router = TestBed.inject(Router);
        const navSpy = jest.spyOn(router, 'navigate');
        component.playWorkout('w1');
        expect(navSpy).toHaveBeenCalledWith(['/workouts', 'w1', 'play']);
    });
});
