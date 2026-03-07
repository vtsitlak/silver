import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutItemComponent } from './workout-item.component';
import { TabataWorkout } from '@silver/tabata/states/workouts';

const mockWorkout: TabataWorkout = {
    id: '1',
    name: 'Test Workout',
    description: 'A test workout description',
    totalDurationMinutes: 30,
    blocks: [
        {
            blockName: 'Block 1',
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exercises: ['Burpees', 'Squats'],
            interBlockRestSeconds: 60
        }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedByUserId: 'user1',
    createdByUserId: 'user1',
    generatedByAi: false
};

describe('WorkoutItemComponent', () => {
    let component: WorkoutItemComponent;
    let fixture: ComponentFixture<WorkoutItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutItemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('workout', mockWorkout);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display workout name', () => {
        expect(component.workout().name).toBe('Test Workout');
    });

    it('should return correct blocks count', () => {
        expect(component.blocksCount).toBe(1);
    });

    it('should format duration in minutes', () => {
        expect(component.formattedDuration).toBe('30 min');
    });

    it('should format duration in hours and minutes', () => {
        fixture.componentRef.setInput('workout', { ...mockWorkout, totalDurationMinutes: 90 });
        fixture.detectChanges();
        expect(component.formattedDuration).toBe('1h 30m');
    });

    it('should format duration in hours only', () => {
        fixture.componentRef.setInput('workout', { ...mockWorkout, totalDurationMinutes: 120 });
        fixture.detectChanges();
        expect(component.formattedDuration).toBe('2h');
    });

    it('should emit workoutClick when clicked', () => {
        const emitSpy = jest.spyOn(component.workoutClick, 'emit');
        component.onClick();
        expect(emitSpy).toHaveBeenCalledWith(mockWorkout);
    });
});
