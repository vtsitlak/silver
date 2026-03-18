import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import type { UserWorkout } from './user-workouts.model';
import { USER_WORKOUTS_API_BASE_URL } from './user-workouts-api-base-url';

@Injectable({ providedIn: 'root' })
export class UserWorkoutsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(USER_WORKOUTS_API_BASE_URL);

    private apiUrl(path: string): string {
        const base = (this.baseUrl || '').replace(/\/$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return base ? `${base}${p}` : p;
    }

    /**
     * GET user workout data by userId.
     * Fetches the user_workouts list from Upstash and returns the record whose userId matches.
     * Returns null when no record exists for that userId (HTTP 200 with body null).
     */
    getUserWorkout(userId: string): Observable<UserWorkout | null> {
        return this.http.get<UserWorkout | null>(this.apiUrl(`/api/user-workouts/${encodeURIComponent(userId)}`));
    }

    /**
     * Create or update user workout data (upsert).
     * If a record for the userId exists it is updated; otherwise a new one is created.
     */
    saveUserWorkout(userWorkout: UserWorkout): Observable<UserWorkout> {
        return this.http.put<UserWorkout>(this.apiUrl(`/api/user-workouts/${encodeURIComponent(userWorkout.userId)}`), userWorkout);
    }

    /**
     * Load user workout for userId; if none exists, create one with empty arrays and return it.
     */
    getOrCreateUserWorkout(userId: string): Observable<UserWorkout> {
        return this.getUserWorkout(userId).pipe(
            switchMap((uw) => (uw !== null ? of(uw) : this.saveUserWorkout({ userId, favoriteWorkouts: [], workoutItems: [] })))
        );
    }

    /** DELETE user workout record by userId. */
    deleteUserWorkout(userId: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(this.apiUrl(`/api/user-workouts/${encodeURIComponent(userId)}`)).pipe(
            // Some deployments may not have DELETE enabled yet; fall back to wiping the record via upsert.
            catchError(() => this.saveUserWorkout({ userId, favoriteWorkouts: [], workoutItems: [] }).pipe(switchMap(() => of({ success: true }))))
        );
    }
}
