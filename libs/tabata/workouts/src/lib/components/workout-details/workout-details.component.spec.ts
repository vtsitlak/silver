import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { WorkoutDetailsComponent } from './workout-details.component';
import { WorkoutsFacade, TabataBlock } from '@silver/tabata/states/workouts';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import {
    mockAuthFacade,
    mockUserWorkoutsFacade,
    mockModalController,
    createMockWorkoutsFacade,
    createMockExercisesFacade,
    mockTabataWorkout
} from '@silver/tabata/testing';
import { AuthFacade } from '@silver/tabata/auth';

let mockWorkoutsFacade: ReturnType<typeof createMockWorkoutsFacade>;
let mockExercisesFacade: ReturnType<typeof createMockExercisesFacade>;

describe('WorkoutDetailsComponent', () => {
    let component: WorkoutDetailsComponent;
    let fixture: ComponentFixture<WorkoutDetailsComponent>;

    beforeEach(async () => {
        mockWorkoutsFacade = createMockWorkoutsFacade();
        mockExercisesFacade = createMockExercisesFacade();
        await TestBed.configureTestingModule({
            imports: [WorkoutDetailsComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ModalController, useValue: mockModalController }
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
        expect(component.workout()?.name).toBe(mockTabataWorkout.name);
    });

    it('should return null for non-existent workout', fakeAsync(() => {
        fixture.componentRef.setInput('workoutId', 'non-existent');
        fixture.detectChanges();
        tick();
        expect(component.workout()).toBeNull();
    }));

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

    it('should not load workouts list on init (details page only loads single workout by id)', () => {
        mockWorkoutsFacade.workouts.set([]);
        fixture.detectChanges();
        expect(mockWorkoutsFacade.loadWorkoutById).toHaveBeenCalledWith('1');
        expect(mockWorkoutsFacade.loadWorkouts).not.toHaveBeenCalled();
    });

    it('should return exercise image URL when available', () => {
        expect(component.getExerciseImage('Burpees')).toBe('https://example.com/burpee.gif');
    });

    it('should not fall back to exerciseId while exercises map is not loaded', () => {
        mockExercisesFacade.exercisesMap.set({});
        fixture.detectChanges();
        expect(component.getExerciseName('UnknownId')).toBe('');
    });

    it('should fall back to exerciseId when exercises map is loaded but id is missing', () => {
        const burpees = mockExercisesFacade.exercisesMap()['Burpees'];
        mockExercisesFacade.exercisesMap.set({ Burpees: burpees });
        fixture.detectChanges();
        expect(component.getExerciseName('UnknownId')).toBe('UnknownId');
    });

    it('should return empty string for unknown exercise image', () => {
        expect(component.getExerciseImage('UnknownId')).toBe('');
    });

    it('should call loadExercisesMap with workout exercise ids when workout is set', () => {
        expect(mockExercisesFacade.loadExercisesMap).toHaveBeenCalledWith(['Burpees']);
    });
});
