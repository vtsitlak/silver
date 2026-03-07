import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { WorkoutDetailsComponent } from './workout-details.component';
import { WorkoutsFacade, TabataWorkout, TabataBlock } from '@silver/tabata/states/workouts';

const mockWorkout: TabataWorkout = {
    id: '1',
    name: 'Test Workout',
    description: 'A test workout description',
    totalDurationMinutes: 30,
    blocks: [
        {
            blockName: 'Cardio Block',
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exercises: ['Burpees', 'Mountain Climbers'],
            interBlockRestSeconds: 60
        }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedByUserId: 'user1',
    createdByUserId: 'user1',
    generatedByAi: false
};

const mockWorkoutsFacade = {
    workouts: signal([mockWorkout]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadWorkouts: jest.fn()
};

describe('WorkoutDetailsComponent', () => {
    let component: WorkoutDetailsComponent;
    let fixture: ComponentFixture<WorkoutDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutDetailsComponent],
            providers: [provideRouter([]), { provide: WorkoutsFacade, useValue: mockWorkoutsFacade }]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutDetailsComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('workoutId', '1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should find workout by id', () => {
        expect(component.workout()?.name).toBe('Test Workout');
    });

    it('should return null for non-existent workout', () => {
        fixture.componentRef.setInput('workoutId', 'non-existent');
        fixture.detectChanges();
        expect(component.workout()).toBeNull();
    });

    it('should format duration in minutes', () => {
        expect(component.formatDuration(30)).toBe('30 min');
    });

    it('should format duration in hours and minutes', () => {
        expect(component.formatDuration(90)).toBe('1h 30m');
    });

    it('should format duration in hours only', () => {
        expect(component.formatDuration(120)).toBe('2h');
    });

    it('should calculate block duration correctly', () => {
        const block: TabataBlock = {
            blockName: 'Test',
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exercises: ['Ex1'],
            interBlockRestSeconds: 60
        };
        const duration = component.getBlockDuration(block);
        expect(duration).toBe(5);
    });

    it('should load workouts on init if empty', () => {
        mockWorkoutsFacade.workouts.set([]);
        component.ngOnInit();
        expect(mockWorkoutsFacade.loadWorkouts).toHaveBeenCalled();
    });
});
