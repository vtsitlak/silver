import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { WorkoutDetailsModalComponent } from './workout-details-modal.component';
import type { TabataWorkout } from '@silver/tabata/states/workouts';

const mockWorkout: TabataWorkout = {
    id: '1',
    name: 'Test Workout',
    description: 'Test description',
    totalDurationMinutes: 30,
    warmup: { totalDurationSeconds: 300, movements: [] },
    blocks: [
        {
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'burpees',
            interBlockRestSeconds: 60
        }
    ],
    cooldown: { totalDurationSeconds: 120, movements: [] },
    createdAt: '2024-01-01T00:00:00Z',
    updatedByUserId: 'u1',
    createdByUserId: 'u1',
    generatedByAi: false,
    mainTargetBodypart: 'back',
    secondaryTargetBodyparts: [],
    availableEquipments: []
};

const mockModalController = {
    dismiss: jest.fn(() => Promise.resolve())
};

describe('WorkoutDetailsModalComponent', () => {
    let component: WorkoutDetailsModalComponent;
    let fixture: ComponentFixture<WorkoutDetailsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutDetailsModalComponent],
            providers: [provideRouter([]), { provide: ModalController, useValue: mockModalController }]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutDetailsModalComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('workout', mockWorkout);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call dismiss when onClose is called', () => {
        component.onClose();
        expect(mockModalController.dismiss).toHaveBeenCalled();
    });

    it('should format duration in minutes', () => {
        expect(component.formatDuration(30)).toBe('30 min');
        expect(component.formatDuration(90)).toBe('1h 30m');
    });
});
