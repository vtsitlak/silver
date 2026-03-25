/**
 * Resolve a workout display name without briefly showing the raw `workoutId`
 * while the workouts list is still loading.
 */
export function resolveWorkoutName(workoutNameMap: Map<string, string>, workoutId: string, hasWorkouts: boolean): string {
    const name = workoutNameMap.get(workoutId);
    if (name) return name;

    // Avoid ID "flash" until the workouts list is loaded.
    return hasWorkouts ? workoutId : '';
}
