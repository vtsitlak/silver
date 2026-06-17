import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@silver/tabata/helpers';
import { AuthFacade } from '@silver/tabata/auth';
import { AuthService } from '@silver/tabata/states/auth';
import { WORKOUTS_AUTH_TOKEN, WorkoutsService } from '@silver/tabata/states/workouts';
import { USER_WORKOUTS_AUTH_TOKEN, UserWorkoutsService } from '@silver/tabata/states/user-workouts';
import { catchError, concatMap, defer, from, map, of, switchMap, throwError, toArray } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeleteAccountService {
    private readonly authFacade = inject(AuthFacade);
    private readonly authService = inject(AuthService);
    private readonly workoutsService = inject(WorkoutsService);
    private readonly userWorkoutsService = inject(UserWorkoutsService);
    private readonly workoutsAuthToken = inject(WORKOUTS_AUTH_TOKEN);
    private readonly userWorkoutsAuthToken = inject(USER_WORKOUTS_AUTH_TOKEN);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);

    deleteAccount() {
        const userId = this.authFacade.user()?.uid ?? null;
        if (!userId) {
            this.toast.showError('No user signed in');
            return of(false);
        }

        return defer(() => from(Promise.all([Promise.resolve(this.workoutsAuthToken()), Promise.resolve(this.userWorkoutsAuthToken())]))).pipe(
            switchMap(([workoutsAuthToken, userWorkoutsAuthToken]) => {
                if (!workoutsAuthToken || !userWorkoutsAuthToken) {
                    return throwError(() => new Error('No user signed in.'));
                }

                return this.workoutsService.getWorkouts().pipe(
                    map((all) => all.filter((w) => w.createdByUserId === userId)),
                    switchMap((owned) =>
                        this.authService.deleteCurrentUser().pipe(
                            switchMap(() =>
                                owned.length === 0
                                    ? of([])
                                    : of(...owned).pipe(
                                          concatMap((w) => this.workoutsService.deleteWorkout(w.id, workoutsAuthToken)),
                                          toArray()
                                      )
                            ),
                            switchMap(() => this.userWorkoutsService.deleteUserWorkout(userId, userWorkoutsAuthToken))
                        )
                    )
                );
            }),
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
