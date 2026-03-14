/**
 * One completed/in-progress workout session for a user.
 */
export interface UserWorkoutItem {
    workoutId: string;
    completed: boolean;
    startedAt: string;
    finishedAt: string;
}

/**
 * Per-user data: favorites and workout history (items).
 * Stored in Upstash under user_workouts.
 */
export interface UserWorkout {
    userId: string;
    favoriteWorkouts: string[];
    workoutItems: UserWorkoutItem[];
}

export interface UserWorkoutsState {
    userWorkout: UserWorkout | null;
    isLoading: boolean;
    error: string | null;
}

export const userWorkoutsInitialState: UserWorkoutsState = {
    userWorkout: null,
    isLoading: false,
    error: null
};
