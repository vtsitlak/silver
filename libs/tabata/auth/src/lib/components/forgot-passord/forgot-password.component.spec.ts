import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '@silver/tabata/states/auth';
import { ForgotPasswordComponent } from './forgot-password.component';

const mockAuthFacade = {
    user: () => null,
    error: () => null,
    isLoading: () => false,
    isAuthenticated: () => false,
    usePassword: () => true,
    useGoogle: () => false,
    hasError: () => false,
    sign: () => { return; },
    register: () => { return; },
    sendPasswordResetEmail: () => { return; },
    updateDisplayName: () => { return; },
    updatePassword: () => { return; },
    logout: () => { return; },
    getUser: () => { return; }
};

describe('ForgotPasswordComponent', () => {
    let component: ForgotPasswordComponent;
    let fixture: ComponentFixture<ForgotPasswordComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ForgotPasswordComponent],
            providers: [{ provide: AuthFacade, useValue: mockAuthFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(ForgotPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
