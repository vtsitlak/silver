import { inject, Injectable } from '@angular/core';
import { WorkoutsStore } from './workouts.store';

@Injectable({ providedIn: 'root' })
export class WorkoutsFacade {
    private readonly store = inject(WorkoutsStore);

    // TODO: expose store signals and methods
}
