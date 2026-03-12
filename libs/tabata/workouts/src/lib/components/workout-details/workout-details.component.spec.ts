import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { WorkoutDetailsComponent } from './workout-details.component';
import { WorkoutsFacade, TabataWorkout, TabataBlock } from '@silver/tabata/states/workouts';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { mockAuthFacade } from '@silver/tabata/testing';
import { AuthFacade } from '@silver/tabata/auth';

const mockWorkout: TabataWorkout = {
    id: '1',
    name: 'Test Workout',
    description: 'A test workout description',
    totalDurationMinutes: 30,
    blocks: [
        {
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'Burpees',
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
    loadedWorkout: signal<TabataWorkout | null>(mockWorkout),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadWorkouts: jest.fn(),
    loadWorkoutById: jest.fn((id: string) => {
        if (id === 'non-existent') {
            mockWorkoutsFacade.loadedWorkout.set(null);
        }
    })
};

const mockExercise = {
    exerciseId: 'Burpees',
    name: 'Burpees',
    gifUrl: 'https://example.com/burpee.gif',
    targetMuscles: [],
    bodyParts: [],
    equipments: [],
    secondaryMuscles: [],
    instructions: []
};

const mockExercisesFacade = {
    exercisesMap: signal<Record<string, typeof mockExercise>>({ Burpees: mockExercise }),
    loadExercisesMap: jest.fn()
};

describe('WorkoutDetailsComponent', () => {
    let component: WorkoutDetailsComponent;
    let fixture: ComponentFixture<WorkoutDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutDetailsComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ExercisesFacade, useValue: mockExercisesFacade }
            ]
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
        expect(component.formatDurationMinutes(30)).toBe('30 min');
    });

    it('should format duration in hours and minutes', () => {
        expect(component.formatDurationMinutes(90)).toBe('1h 30m');
    });

    it('should format duration in hours only', () => {
        expect(component.formatDurationMinutes(120)).toBe('2h');
    });

    it('should calculate block duration correctly', () => {
        const block: TabataBlock = {
            rounds: 8,
            workDurationSeconds: 20,
            restDurationSeconds: 10,
            exerciseId: 'Ex1',
            interBlockRestSeconds: 60
        };
        const duration = component.getBlockDurationMinutes(block);
        expect(duration).toBe(5);
    });

    it('should load workouts on init if empty', () => {
        mockWorkoutsFacade.workouts.set([]);
        component.ngOnInit();
        expect(mockWorkoutsFacade.loadWorkouts).toHaveBeenCalled();
    });

    it('should return exercise image URL when available', () => {
        expect(component.getExerciseImage('Burpees')).toBe('https://example.com/burpee.gif');
    });

    it('should return empty string for unknown exercise image', () => {
        expect(component.getExerciseImage('UnknownId')).toBe('');
    });

    it('should call loadExercisesMap with workout exercise ids when workout is set', () => {
        expect(mockExercisesFacade.loadExercisesMap).toHaveBeenCalledWith(['Burpees']);
    });
});
