import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabataWorkout } from '@silver/tabata/states/workouts';
import { mockTabataWorkout } from '@silver/tabata/testing';
import { WorkoutItemComponent } from './workout-item.component';

const mockWorkout: TabataWorkout = { ...mockTabataWorkout } as TabataWorkout;

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

    it('should emit detailsClick when name is clicked', () => {
        const emitSpy = jest.spyOn(component.detailsClick, 'emit');
        component.onDetailsClick();
        expect(emitSpy).toHaveBeenCalledWith(mockWorkout);
    });

    it('should emit editClick when edit button is clicked', () => {
        const emitSpy = jest.spyOn(component.editClick, 'emit');
        component.onEditClick(new Event('click'));
        expect(emitSpy).toHaveBeenCalledWith(mockWorkout);
    });

    it('should emit playClick when play button is clicked', () => {
        const emitSpy = jest.spyOn(component.playClick, 'emit');
        component.onPlayClick(new Event('click'));
        expect(emitSpy).toHaveBeenCalledWith(mockWorkout);
    });

    it('should emit removeClick when remove button is clicked', () => {
        const emitSpy = jest.spyOn(component.removeClick, 'emit');
        component.onRemoveClick(new Event('click'));
        expect(emitSpy).toHaveBeenCalledWith(mockWorkout);
    });
});
