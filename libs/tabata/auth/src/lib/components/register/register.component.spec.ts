import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/states/auth';
import { mockAuthFacade } from '@silver/tabata/testing';
import { RegisterComponent } from './register.component';

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

    it('should not use novalidate on the form', () => {
        const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;

        expect(formElement.hasAttribute('novalidate')).toBe(false);
    });

    it('should use a non-submit primary action button', () => {
        const submitButton = fixture.nativeElement.querySelector('ion-button[type="button"]');

        expect(submitButton).toBeTruthy();
    });
});
