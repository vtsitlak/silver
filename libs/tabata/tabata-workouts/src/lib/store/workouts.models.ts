// Workout and store state models for tabata-workouts.

export interface WorkoutsState {
    workouts: TabataWorkout[];
    isLoading: boolean;
    error: string | null;
}

export const workoutsInitialState: WorkoutsState = {
    workouts: [],
    isLoading: false,
    error: null
};

export interface TabataWorkout {
  id: string;
  name: string;
  description: string;
  warmup: FreeExercise[];
  maim: TabataBlock[];
  cooldown: FreeExercise[];
  totalDuration: number;
  script: string;
}

export interface FreeExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  duration: number;
  script: string;
}

export interface TabataBlock {
  exercisesIds: string[];
  rounds: number;
  rest: number;
  duration: number;
}
