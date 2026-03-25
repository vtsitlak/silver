import { resolveWorkoutName } from './workout-name.helpers';

describe('workout-name.helpers', () => {
    it('returns the name from the map when available', () => {
        const map = new Map<string, string>([['w1', 'Workout 1']]);
        expect(resolveWorkoutName(map, 'w1', false)).toBe('Workout 1');
    });

    it('returns empty string while workouts list is not loaded', () => {
        const map = new Map<string, string>();
        expect(resolveWorkoutName(map, 'w1', false)).toBe('');
    });

    it('falls back to workoutId when workouts list is loaded', () => {
        const map = new Map<string, string>();
        expect(resolveWorkoutName(map, 'w1', true)).toBe('w1');
    });
});
