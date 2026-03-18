import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { mockActionSheetController, mockAuthFacade, mockModalController } from '@silver/tabata/testing';
import { ProfileComponent } from './profile.component';
import { DeleteAccountService } from '../../services/delete-account.service';

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: ActionSheetController, useValue: mockActionSheetController },
                { provide: DeleteAccountService, useValue: { deleteAccount: jest.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
