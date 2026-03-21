import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { AuthFacade } from '@silver/tabata/auth';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { mockAuthFacade, mockModalController, createMockExercisesFacade } from '@silver/tabata/testing';
import type { Exercise } from '@silver/tabata/states/exercises';
import { WorkoutPhaseComponent } from './workout-phase.component';

const mockExercisesFacade = createMockExercisesFacade();

describe('WorkoutPhaseComponent', () => {
    let component: WorkoutPhaseComponent;
    let fixture: ComponentFixture<WorkoutPhaseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutPhaseComponent],
            providers: [
                provideRouter([]),
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutPhaseComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('loadedPhase', null);
        fixture.componentRef.setInput('phaseType', 'warmup');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit draftChange when phase items change', async () => {
        await fixture.whenStable();
        const emitted: unknown[] = [];
        component.draftChange.subscribe((v) => emitted.push(v));
        component.phaseItems.set([
            {
                exercise: {
                    exerciseId: 'e1',
                    name: 'Stretch',
                    images: [],
                    targetMuscles: [],
                    category: [],
                    equipments: [],
                    secondaryMuscles: [],
                    instructions: []
                },
                durationSeconds: 60
            }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(emitted.length).toBeGreaterThan(0);
        expect(emitted.some((e) => typeof e === 'object' && e !== null && 'warmup' in (e as object))).toBe(true);
    });

    it('should reorder phase items on ionReorderEnd and update duration modal index', () => {
        const items = [
            {
                exercise: { exerciseId: 'a', name: 'A', images: [], targetMuscles: [], category: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 30
            },
            {
                exercise: { exerciseId: 'b', name: 'B', images: [], targetMuscles: [], category: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 45
            },
            {
                exercise: { exerciseId: 'c', name: 'C', images: [], targetMuscles: [], category: [], equipments: [], secondaryMuscles: [], instructions: [] },
                durationSeconds: 60
            }
        ];
        component.phaseItems.set([...items]);
        fixture.detectChanges();
        const completeSpy = jest.fn();
        component.handleReorderEnd({
            detail: { from: 2, to: 0, complete: completeSpy },
            preventDefault: jest.fn()
        } as unknown as CustomEvent<{ from: number; to: number; complete: (data?: boolean | unknown[]) => void }>);
        expect(component.phaseItems().map((p) => p.exercise.exerciseId)).toEqual(['c', 'a', 'b']);
        expect(completeSpy).toHaveBeenCalledWith(true);
    });

    it('getExerciseImage should prefer images on the exercise over the map', () => {
        const ex: Exercise = {
            exerciseId: 'local-thumb',
            name: 'Local',
            images: ['https://cdn.example/from-exercise.png'],
            targetMuscles: [],
            category: [],
            equipments: [],
            secondaryMuscles: [],
            instructions: []
        };
        expect(component.getExerciseImage(ex)).toBe('https://cdn.example/from-exercise.png');
    });

    it('getExerciseImage should fall back to exercisesMap when exercise has no images', () => {
        mockExercisesFacade.exercisesMap.set({
            fallbackId: {
                exerciseId: 'fallbackId',
                name: 'F',
                images: ['https://cdn.example/from-map.png'],
                targetMuscles: [],
                category: [],
                equipments: [],
                secondaryMuscles: [],
                instructions: []
            }
        });
        const ex: Exercise = {
            exerciseId: 'fallbackId',
            name: 'F',
            images: [],
            targetMuscles: [],
            category: [],
            equipments: [],
            secondaryMuscles: [],
            instructions: []
        };
        expect(component.getExerciseImage(ex)).toBe('https://cdn.example/from-map.png');
    });
});
