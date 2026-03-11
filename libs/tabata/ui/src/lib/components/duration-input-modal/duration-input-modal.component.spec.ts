import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DurationInputModalComponent } from './duration-input-modal.component';

describe('DurationInputModalComponent', () => {
    let component: DurationInputModalComponent;
    let fixture: ComponentFixture<DurationInputModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DurationInputModalComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DurationInputModalComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('isOpen', false);
        fixture.componentRef.setInput('durationSeconds', 30);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit save with current duration when onSave is called', () => {
        fixture.componentRef.setInput('durationSeconds', 45);
        fixture.detectChanges();
        const spy = jest.spyOn(component.save, 'emit');
        component.onSave();
        expect(spy).toHaveBeenCalledWith(45);
    });

    it('should emit didDismiss when onDismiss is called', () => {
        const spy = jest.spyOn(component.didDismiss, 'emit');
        component.onDismiss();
        expect(spy).toHaveBeenCalled();
    });

    it('should emit durationChange when onDurationInput is called', () => {
        const spy = jest.spyOn(component.durationChange, 'emit');
        component.onDurationInput({ detail: { value: '60' } } as unknown as Event);
        expect(spy).toHaveBeenCalledWith(60);
    });
});
