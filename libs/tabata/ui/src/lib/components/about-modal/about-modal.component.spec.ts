import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutModalComponent } from './about-modal.component';
import { ModalController } from '@ionic/angular/standalone';

describe('AboutModalComponent', () => {
    let component: AboutModalComponent;
    let fixture: ComponentFixture<AboutModalComponent>;
    let mockModalCtrl: { dismiss: jest.Mock };

    beforeEach(async () => {
        mockModalCtrl = { dismiss: jest.fn().mockResolvedValue(undefined) };

        await TestBed.configureTestingModule({
            imports: [AboutModalComponent],
            providers: [{ provide: ModalController, useValue: mockModalCtrl }]
        }).compileComponents();

        fixture = TestBed.createComponent(AboutModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss modal when onClose is called', () => {
        component.onClose();
        expect(mockModalCtrl.dismiss).toHaveBeenCalled();
    });
});
