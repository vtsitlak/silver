import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { mockModalController } from '@silver/tabata/testing';
import { AiWorkoutGeneratedModalComponent } from './ai-workout-generated-modal.component';

describe('AiWorkoutGeneratedModalComponent', () => {
    let component: AiWorkoutGeneratedModalComponent;
    let fixture: ComponentFixture<AiWorkoutGeneratedModalComponent>;

    beforeEach(async () => {
        jest.clearAllMocks();
        await TestBed.configureTestingModule({
            imports: [AiWorkoutGeneratedModalComponent],
            providers: [{ provide: ModalController, useValue: mockModalController }]
        }).compileComponents();

        fixture = TestBed.createComponent(AiWorkoutGeneratedModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with confirm role when Got it is used', () => {
        component.onDismiss();
        expect(mockModalController.dismiss).toHaveBeenCalledWith(null, 'confirm');
    });

    it('should show success copy directing users to workout tabs', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Workout generated successfully');
        expect(el.textContent).toContain('You can navigate to the workout tabs to edit and save the workout.');
        expect(el.textContent).toContain('Got it');
    });
});
