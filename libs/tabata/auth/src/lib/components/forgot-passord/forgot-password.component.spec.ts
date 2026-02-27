import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '../../store/auth.facade';
import { ForgotPasswordComponent } from './forgot-password.component';

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
