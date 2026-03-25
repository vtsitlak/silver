/**
 * Resolve an exercise display name without briefly showing the raw `exerciseId`
 * while the exercises map is still loading.
 */
export function resolveExerciseName(exercisesMap: Record<string, { name?: string }>, exerciseId: string, hasExercisesMap: boolean): string {
    const name = exercisesMap?.[exerciseId]?.name;
    if (name) return name;

    // Avoid ID "flash" until the exercises map is loaded.
    return hasExercisesMap ? exerciseId : '';
}
