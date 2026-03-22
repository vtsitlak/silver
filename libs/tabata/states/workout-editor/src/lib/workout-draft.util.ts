import type { WorkoutDraft } from './workout-editor.models';

/**
 * Edit mode: compare draft to initial snapshot without JSON.stringify (key order breaks equality)
 * and treat `null` vs `undefined` / missing keys as equal where children merge partial patches.
 */
export function areWorkoutDraftsEqual(a: WorkoutDraft, b: WorkoutDraft): boolean {
    return valuesEqualNormalized(a as unknown, b as unknown);
}

function valuesEqualNormalized(x: unknown, y: unknown): boolean {
    if (Object.is(x, y)) return true;
    if (x == null && y == null) return true;
    if (x == null || y == null) return false;
    if (typeof x !== typeof y) return false;
    if (typeof x !== 'object') return false;
    if (Array.isArray(x) !== Array.isArray(y)) return false;
    if (Array.isArray(x) && Array.isArray(y)) {
        if (x.length !== y.length) return false;
        return x.every((v, i) => valuesEqualNormalized(v, y[i]));
    }
    const xo = x as Record<string, unknown>;
    const yo = y as Record<string, unknown>;
    const keys = new Set([...Object.keys(xo), ...Object.keys(yo)]);
    for (const k of keys) {
        if (!valuesEqualNormalized(xo[k], yo[k])) return false;
    }
    return true;
}

function phaseMovementMeaningful(m: { exerciseId?: string; durationSeconds?: number } | undefined): boolean {
    return Boolean(m?.exerciseId?.trim() && typeof m.durationSeconds === 'number' && m.durationSeconds > 0);
}

function blockMeaningful(b: { exerciseId?: string } | undefined): boolean {
    return Boolean(b?.exerciseId?.trim());
}

/**
 * Create mode: "unsaved" only when the user has entered real workout data — not empty placeholders
 * from child effects (e.g. `{ blocks: [{ exerciseId: '' }] }` or empty movement rows).
 */
export function draftHasMeaningfulContent(draft: WorkoutDraft): boolean {
    if (Object.keys(draft).length === 0) return false;
    if (typeof draft.name === 'string' && draft.name.trim() !== '') return true;
    if (typeof draft.description === 'string' && draft.description.trim() !== '') return true;
    if (draft.mainTargetBodypart != null) return true;
    if (Array.isArray(draft.availableEquipments) && draft.availableEquipments.length > 0) return true;
    if (Array.isArray(draft.secondaryTargetBodyparts) && draft.secondaryTargetBodyparts.length > 0) return true;
    if (draft.generatedByAi === true) return true;

    const warmupMovements = draft.warmup?.movements;
    if (Array.isArray(warmupMovements) && warmupMovements.some((m) => phaseMovementMeaningful(m))) return true;

    const cooldownMovements = draft.cooldown?.movements;
    if (Array.isArray(cooldownMovements) && cooldownMovements.some((m) => phaseMovementMeaningful(m))) return true;

    const blocks = draft.blocks;
    if (Array.isArray(blocks) && blocks.some((b) => blockMeaningful(b))) return true;

    return false;
}
