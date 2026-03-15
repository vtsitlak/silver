import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent } from './toolbar.component';
import { ModalController } from '@ionic/angular/standalone';
import { AboutModalComponent } from '../about-modal/about-modal.component';

describe('ToolbarComponent', () => {
    let component: ToolbarComponent;
    let fixture: ComponentFixture<ToolbarComponent>;
    let mockModalCtrl: { create: jest.Mock };

    beforeEach(async () => {
        const present = jest.fn().mockResolvedValue(undefined);
        mockModalCtrl = { create: jest.fn().mockResolvedValue({ present }) };

        await TestBed.configureTestingModule({
            imports: [ToolbarComponent],
            providers: [{ provide: ModalController, useValue: mockModalCtrl }]
        }).compileComponents();

        fixture = TestBed.createComponent(ToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should present about modal when openAbout is called', async () => {
        await component.openAbout();
        expect(mockModalCtrl.create).toHaveBeenCalledWith({
            component: AboutModalComponent,
            cssClass: 'about-modal-sheet'
        });
    });
});
