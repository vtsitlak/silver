import { resolveExerciseName } from './exercise-name.helpers';

describe('exercise-name.helpers', () => {
    it('returns the name from the map when available', () => {
        const map = { e1: { name: 'Pushup' } };
        expect(resolveExerciseName(map, 'e1', false)).toBe('Pushup');
    });

    it('returns empty string while exercises map is not loaded', () => {
        const map = {};
        expect(resolveExerciseName(map, 'e1', false)).toBe('');
    });

    it('falls back to exerciseId when exercises map is loaded', () => {
        const map = {};
        expect(resolveExerciseName(map, 'e1', true)).toBe('e1');
    });
});
