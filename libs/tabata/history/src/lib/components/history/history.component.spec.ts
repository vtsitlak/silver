import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { HistoryComponent } from './history.component';

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

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HistoryComponent],
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
