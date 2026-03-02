// Workout and store state models for tabata-workouts.

export interface WorkoutsState {
    // TODO: add state shape
}

export const workoutsInitialState: WorkoutsState = {
    // TODO: add initial values
};

export interface TabataWorkout {
  id: string;
  name: string;
  description: string;
  warmup: FreeExercise[];
  tabata: Tabata;
  cooldown: FreeExercise[];
  totalDuration: number;
}

export interface FreeExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  duration: number;
}

export interface Tabata {
  exercisesIds: string[];
  rounds: number;
  rest: number;
  duration: number;
}
