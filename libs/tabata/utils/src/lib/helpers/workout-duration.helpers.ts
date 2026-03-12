/**
 * Input shape for computing block duration (compatible with TabataBlock).
 */
export interface BlockDurationInput {
    rounds: number;
    workDurationSeconds: number;
    restDurationSeconds: number;
    interBlockRestSeconds: number;
}

/** Format total duration in minutes as "30 min" or "1h 30m". */
export function formatDurationMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/** Compute block duration in minutes (rounded up). */
export function getBlockDurationMinutes(block: BlockDurationInput): number {
    const roundDuration = block.workDurationSeconds + block.restDurationSeconds;
    const totalRoundsDuration = roundDuration * block.rounds;
    return Math.ceil((totalRoundsDuration + block.interBlockRestSeconds) / 60);
}

/** Convert seconds to minutes (rounded up). */
export function formatSecondsToMinutes(seconds: number): number {
    return Math.ceil(seconds / 60);
}
