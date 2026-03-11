import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/states/auth';
import { RegisterComponent } from './register.component';

const mockAuthFacade = {
    user: () => null,
    error: () => null,
    isLoading: () => false,
    isAuthenticated: () => false,
    usePassword: () => true,
    useGoogle: () => false,
    hasError: () => false,
    sign: () => {
        return;
    },
    register: () => {
        return;
    },
    sendPasswordResetEmail: () => {
        return;
    },
    updateDisplayName: () => {
        return;
    },
    updatePassword: () => {
        return;
    },
    logout: () => {
        return;
    },
    getUser: () => {
        return;
    }
};

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterComponent],
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
