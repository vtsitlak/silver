import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthInfoModalComponent } from './auth-info-modal.component';

describe('AuthInfoModalComponent', () => {
    let component: AuthInfoModalComponent;
    let fixture: ComponentFixture<AuthInfoModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AuthInfoModalComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AuthInfoModalComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit closed when onClose is called', () => {
        const spy = jest.spyOn(component.closed, 'emit');
        component.onClose();
        expect(spy).toHaveBeenCalled();
    });

    it('should emit closed when onDidDismiss is called', () => {
        const spy = jest.spyOn(component.closed, 'emit');
        component.onDidDismiss();
        expect(spy).toHaveBeenCalled();
    });
});
