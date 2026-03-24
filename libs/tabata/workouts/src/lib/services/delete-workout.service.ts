import { inject, Injectable } from '@angular/core';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeleteWorkoutService {
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly authFacade = inject(AuthFacade);
    private readonly userWorkoutsFacade = inject(UserWorkoutsFacade);

    deleteWorkoutAndCleanup(workoutId: string): Observable<{ success: boolean }> {
        return this.workoutsFacade.removeWorkout(workoutId).pipe(
            tap((res) => {
                if (res?.success) {
                    this.removeDeletedWorkoutFromUserWorkout(workoutId);
                }
            })
        );
    }

    private removeDeletedWorkoutFromUserWorkout(workoutId: string): void {
        const userId = (this.authFacade.user() as { uid?: string } | null)?.uid;
        const current = this.userWorkoutsFacade.userWorkout();
        if (!userId || !current || current.userId !== userId) return;

        const favoriteWorkouts = (current.favoriteWorkouts ?? []).filter((id) => id !== workoutId);
        const workoutItems = (current.workoutItems ?? []).filter((item) => item.workoutId !== workoutId);
        const changed = favoriteWorkouts.length !== (current.favoriteWorkouts ?? []).length || workoutItems.length !== (current.workoutItems ?? []).length;
        if (!changed) return;

        this.userWorkoutsFacade.saveUserWorkout({
            ...current,
            favoriteWorkouts,
            workoutItems
        });
    }
}

