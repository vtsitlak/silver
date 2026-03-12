import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutsComponent } from './workouts.component';
import { ModalController } from '@ionic/angular/standalone';

const mockAuthFacade = {
    user: () => null,
    error: () => null,
    isLoading: () => false,
    isAuthenticated: () => false,
    usePassword: () => true,
    useGoogle: () => false,
    hasError: () => false,
    sign: jest.fn(),
    register: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateDisplayName: jest.fn(),
    updatePassword: jest.fn(),
    logout: jest.fn(),
    getUser: jest.fn()
};

const mockWorkoutsFacade = {
    workouts: () => [],
    isLoading: () => false,
    error: () => null,
    loadWorkouts: jest.fn(),
    removeWorkout: jest.fn(() => of({ success: true }))
};

const mockModalController = {
    create: jest.fn(() => Promise.resolve({ present: jest.fn(() => Promise.resolve()) }))
};

const mockToastService = {
    showSuccess: jest.fn(),
    showError: jest.fn()
};

describe('WorkoutsComponent', () => {
    let component: WorkoutsComponent;
    let fixture: ComponentFixture<WorkoutsComponent>;

    beforeEach(async () => {
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
