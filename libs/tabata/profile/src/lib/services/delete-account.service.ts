import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { WorkoutsService } from '@silver/tabata/states/workouts';
import { UserWorkoutsService } from '@silver/tabata/states/user-workouts';
import { catchError, concatMap, map, of, switchMap, toArray } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeleteAccountService {
    private readonly authFacade = inject(AuthFacade);
    private readonly authService = inject(AuthService);
    private readonly workoutsService = inject(WorkoutsService);
    private readonly userWorkoutsService = inject(UserWorkoutsService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);

    deleteAccount() {
        const userId = this.authFacade.user()?.uid ?? null;
        if (!userId) {
            this.toast.showError('No user signed in');
            return of(false);
        }

        return this.authService.deleteCurrentUser().pipe(
            switchMap(() =>
                this.workoutsService.getWorkouts().pipe(
                    map((all) => all.filter((w) => w.createdByUserId === userId)),
                    switchMap((owned) =>
                        owned.length === 0
                            ? of([])
                            : of(...owned).pipe(
                                  concatMap((w) => this.workoutsService.deleteWorkout(w.id)),
                                  toArray()
                              )
                    )
                )
            ),
            switchMap(() => this.userWorkoutsService.deleteUserWorkout(userId)),
            map(() => true),
            catchError((err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                this.toast.showError(message || 'Failed to delete account');
                return of(false);
            }),
            switchMap((success) => {
                if (!success) return of(false);
                this.toast.showSuccess('Account deleted');
                return this.router.navigateByUrl('/auth/login').then(() => true);
            })
        );
    }
}
