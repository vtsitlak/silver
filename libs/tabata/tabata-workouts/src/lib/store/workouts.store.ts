import { inject, signalStore, withState, withMethods } from '@ngrx/signals';
import { workoutsInitialState, type WorkoutsState } from './workouts.models';
import { WorkoutsService } from './workouts.service';

export const WorkoutsStore = signalStore(
    { providedIn: 'root' },
    withState<WorkoutsState>(workoutsInitialState),
    withMethods((store, workoutsService = inject(WorkoutsService)) => ({
        // TODO: add loadWorkouts, loadWorkoutById, etc. using workoutsService
    }))
);
