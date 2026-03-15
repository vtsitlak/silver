import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/states/auth';
import { mockAuthFacade } from '@silver/tabata/testing';
import { LoginComponent } from './login.component';
import { ActionSheetController } from '@ionic/angular/standalone';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let mockActionSheetCtrl: { create: jest.Mock };

    beforeEach(async () => {
        const present = jest.fn().mockResolvedValue(undefined);
        mockActionSheetCtrl = {
            create: jest.fn().mockResolvedValue({ present })
        };

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }, { provide: ActionSheetController, useValue: mockActionSheetCtrl }]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should present action sheet with demo info when openInfoSheet is called', async () => {
        await component.openInfoSheet();
        expect(mockActionSheetCtrl.create).toHaveBeenCalledWith(
            expect.objectContaining({
                header: 'About this app',
                subHeader: expect.stringContaining('Demo app'),
                buttons: [{ text: 'Close', role: 'cancel' }]
            })
        );
    });
});
