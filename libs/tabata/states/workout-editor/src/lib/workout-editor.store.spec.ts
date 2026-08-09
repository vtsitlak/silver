import { TestBed } from '@angular/core/testing';
import { WorkoutEditorStore } from './workout-editor.store';
import type { AiGeneratedWorkoutStructure } from './workout-editor.models';

describe('WorkoutEditorStore AI structure lock', () => {
    let store: InstanceType<typeof WorkoutEditorStore>;

    const aiStructure: AiGeneratedWorkoutStructure = {
        totalDurationMinutes: 25,
        warmup: {
            totalDurationSeconds: 120,
            movements: [{ exerciseId: 'wu1', durationSeconds: 60 }]
        },
        blocks: [
            {
                rounds: 4,
                workDurationSeconds: 20,
                restDurationSeconds: 10,
                exerciseId: 'ai-block',
                interBlockRestSeconds: 60
            }
        ],
        cooldown: {
            totalDurationSeconds: 90,
            movements: [{ exerciseId: 'cd1', durationSeconds: 90 }]
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WorkoutEditorStore]
        });
        store = TestBed.inject(WorkoutEditorStore);
        store.updateDraft({
            name: 'Test',
            description: 'Desc',
            mainTargetBodypart: 'Core',
            level: 'beginner',
            primaryGoal: 'Cardio'
        });
    });

    it('pins AI structure so child tab draft sync cannot overwrite blocks/warmup/cooldown', () => {
        store.lockAiGeneratedStructure(aiStructure);

        store.updateDraft({
            blocks: [
                {
                    rounds: 8,
                    workDurationSeconds: 20,
                    restDurationSeconds: 10,
                    exerciseId: 'stale-local',
                    interBlockRestSeconds: 60
                }
            ],
            warmup: { totalDurationSeconds: 0, movements: [] },
            cooldown: { totalDurationSeconds: 0, movements: [] }
        });

        const draft = store.workoutDraft();
        expect(draft.blocks).toEqual(aiStructure.blocks);
        expect(draft.warmup).toEqual(aiStructure.warmup);
        expect(draft.cooldown).toEqual(aiStructure.cooldown);
        expect(draft.totalDurationMinutes).toBe(25);
        expect(draft.generatedByAi).toBe(true);
        expect(draft.name).toBe('Test');
    });

    it('syncs initialDraftSnapshot structure on lock so mounted tabs rehydrate to the AI workout', () => {
        store.lockAiGeneratedStructure(aiStructure);

        const snapshot = store.initialDraftSnapshot();
        expect(snapshot.blocks).toEqual(aiStructure.blocks);
        expect(snapshot.warmup).toEqual(aiStructure.warmup);
        expect(snapshot.cooldown).toEqual(aiStructure.cooldown);
        expect(snapshot.totalDurationMinutes).toBe(25);
        expect(snapshot.generatedByAi).toBe(true);
        // Info fields on the live draft are not wiped by snapshot sync.
        expect(store.workoutDraft().name).toBe('Test');
    });

    it('allows info-field updates while the AI structure lock is active', () => {
        store.lockAiGeneratedStructure(aiStructure);
        store.updateDraft({ name: 'Renamed', description: 'Updated' });

        const draft = store.workoutDraft();
        expect(draft.name).toBe('Renamed');
        expect(draft.description).toBe('Updated');
        expect(draft.blocks).toEqual(aiStructure.blocks);
    });

    it('clears the lock on clearDraft and reset', () => {
        store.lockAiGeneratedStructure(aiStructure);
        expect(store.aiStructureLock()).not.toBeNull();

        store.clearDraft();
        expect(store.aiStructureLock()).toBeNull();

        store.lockAiGeneratedStructure(aiStructure);
        store.reset();
        expect(store.aiStructureLock()).toBeNull();
    });
});
