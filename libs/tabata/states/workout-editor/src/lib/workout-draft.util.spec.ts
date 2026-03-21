import { areWorkoutDraftsEqual, draftHasMeaningfulContent } from './workout-draft.util';
import type { WorkoutDraft } from './workout-editor.models';

describe('areWorkoutDraftsEqual', () => {
    it('should be true when key order differs but values match', () => {
        const a = { name: 'x', description: 'y', warmup: { totalDurationSeconds: 0, movements: [] } };
        const b = { warmup: { movements: [], totalDurationSeconds: 0 }, description: 'y', name: 'x' };
        expect(areWorkoutDraftsEqual(a as WorkoutDraft, b as WorkoutDraft)).toBe(true);
    });

    it('should treat null and undefined as equal for optional fields', () => {
        const a = { name: 'x', extra: null as string | null };
        const b = { name: 'x', extra: undefined };
        expect(areWorkoutDraftsEqual(a as WorkoutDraft, b as WorkoutDraft)).toBe(true);
    });

    it('should be false when a value actually differs', () => {
        expect(areWorkoutDraftsEqual({ name: 'a' } as WorkoutDraft, { name: 'b' } as WorkoutDraft)).toBe(false);
    });
});

describe('draftHasMeaningfulContent', () => {
    it('should be false for empty draft', () => {
        expect(draftHasMeaningfulContent({})).toBe(false);
    });

    it('should be false when only empty placeholders from effects (blocks with empty exerciseId)', () => {
        const draft: WorkoutDraft = {
            blocks: [
                {
                    rounds: 8,
                    workDurationSeconds: 20,
                    restDurationSeconds: 10,
                    exerciseId: '',
                    interBlockRestSeconds: 60
                }
            ]
        };
        expect(draftHasMeaningfulContent(draft)).toBe(false);
    });

    it('should be false when warmup movements exist but exerciseId is empty', () => {
        const draft: WorkoutDraft = {
            warmup: {
                totalDurationSeconds: 60,
                movements: [{ exerciseId: '', durationSeconds: 60 }]
            }
        };
        expect(draftHasMeaningfulContent(draft)).toBe(false);
    });

    it('should be true when a block has a non-empty exerciseId', () => {
        const draft: WorkoutDraft = {
            blocks: [
                {
                    rounds: 8,
                    workDurationSeconds: 20,
                    restDurationSeconds: 10,
                    exerciseId: 'push-up',
                    interBlockRestSeconds: 60
                }
            ]
        };
        expect(draftHasMeaningfulContent(draft)).toBe(true);
    });

    it('should be true when warmup has a valid movement', () => {
        const draft: WorkoutDraft = {
            warmup: {
                totalDurationSeconds: 60,
                movements: [{ exerciseId: 'stretch', durationSeconds: 60 }]
            }
        };
        expect(draftHasMeaningfulContent(draft)).toBe(true);
    });
});
