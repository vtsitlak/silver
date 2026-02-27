import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { ProfileComponent } from './profile.component';

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

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
