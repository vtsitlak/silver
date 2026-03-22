import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Exercise } from '@silver/tabata/states/exercises';
import type { TabataBlock } from '@silver/tabata/states/workouts';
import { MainWorkoutComponent } from './main-workout.component';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { AuthFacade } from '@silver/tabata/auth';
import { ModalController } from '@ionic/angular/standalone';
import { mockAuthFacade, createMockExercisesFacade, mockModalController } from '@silver/tabata/testing';

const mockExercisesFacade = createMockExercisesFacade();

describe('MainWorkoutComponent', () => {
    let component: MainWorkoutComponent;
    let fixture: ComponentFixture<MainWorkoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainWorkoutComponent],
            providers: [
                provideRouter([]),
                { provide: ExercisesFacade, useValue: mockExercisesFacade },
                { provide: ModalController, useValue: mockModalController },
                { provide: AuthFacade, useValue: mockAuthFacade }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MainWorkoutComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('loadedBlocks', []);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render Add block button before the blocks list in the DOM', () => {
        const el = fixture.nativeElement as HTMLElement;
        const buttons = el.querySelectorAll('ion-button');
        const addBtn = Array.from(buttons).find((b) => b.textContent?.includes('Add block'));
        const list = el.querySelector('ion-list.blocks-list');
        expect(addBtn).toBeTruthy();
        expect(list).toBeTruthy();
        if (!addBtn || !list) {
            throw new Error('Add block button and blocks list should be in the DOM');
        }
        expect(addBtn.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should start with 0 blocks when draft has no blocks', () => {
        expect(component.blocks().length).toBe(0);
    });

    it('should call loadExercisesMap when loadedBlocks hydrate with exercise ids', async () => {
        mockExercisesFacade.loadExercisesMap.mockClear();
        const loaded: TabataBlock[] = [
            {
                rounds: 8,
                workDurationSeconds: 20,
                restDurationSeconds: 10,
                exerciseId: 'ex-a',
                interBlockRestSeconds: 60
            }
        ];
        fixture.componentRef.setInput('loadedBlocks', loaded);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(mockExercisesFacade.loadExercisesMap).toHaveBeenCalledWith(['ex-a']);
    });

    it('should emit draftChange when blocks change', async () => {
        await fixture.whenStable();
        const emitted: unknown[] = [];
        component.draftChange.subscribe((v) => emitted.push(v));
        component.blocks.set([
            {
                rounds: 8,
                workDurationSeconds: 20,
                restDurationSeconds: 10,
                exercise: {
                    exerciseId: 'e1',
                    name: 'Push',
                    images: [],
                    targetMuscles: [],
                    category: [],
                    equipments: [],
                    secondaryMuscles: [],
                    instructions: []
                },
                interBlockRestSeconds: 60
            }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(emitted.some((e) => typeof e === 'object' && e !== null && 'blocks' in (e as object))).toBe(true);
    });

    it('should add block on addBlock', () => {
        component.addBlock();
        expect(component.blocks().length).toBe(1);
        component.addBlock();
        expect(component.blocks().length).toBe(2);
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
