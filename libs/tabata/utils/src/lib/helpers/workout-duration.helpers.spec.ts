import { formatDurationMinutes, getBlockDurationMinutes, formatSecondsToMinutes, type BlockDurationInput } from './workout-duration.helpers';

describe('workout-duration.helpers', () => {
    describe('formatDurationMinutes', () => {
        it('returns "X min" when under 60 minutes', () => {
            expect(formatDurationMinutes(30)).toBe('30 min');
            expect(formatDurationMinutes(0)).toBe('0 min');
        });

        it('returns "Xh Ym" when hours and remaining minutes', () => {
            expect(formatDurationMinutes(90)).toBe('1h 30m');
        });

        it('returns "Xh" when exact hours', () => {
            expect(formatDurationMinutes(120)).toBe('2h');
        });
    });

    describe('getBlockDurationMinutes', () => {
        it('computes block duration in minutes rounded up', () => {
            const block: BlockDurationInput = {
                rounds: 8,
                workDurationSeconds: 20,
                restDurationSeconds: 10,
                interBlockRestSeconds: 60
            };
            expect(getBlockDurationMinutes(block)).toBe(5);
        });
    });

    describe('formatSecondsToMinutes', () => {
        it('returns minutes rounded up', () => {
            expect(formatSecondsToMinutes(60)).toBe(1);
            expect(formatSecondsToMinutes(90)).toBe(2);
            expect(formatSecondsToMinutes(0)).toBe(0);
        });
    });
});
