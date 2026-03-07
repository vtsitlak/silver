import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutsComponent } from './workouts.component';

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

describe('WorkoutsComponent', () => {
    let component: WorkoutsComponent;
    let fixture: ComponentFixture<WorkoutsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutsComponent],
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
