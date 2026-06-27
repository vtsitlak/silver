import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { CreateWorkoutPayload, TabataWorkout, UpdateWorkoutPayload } from './workouts.models';
import { WORKOUTS_API_BASE_URL } from './workouts-api-base-url';
import { WORKOUTS_AUTH_TOKEN } from './workouts-auth-token';

@Injectable({ providedIn: 'root' })
export class WorkoutsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(WORKOUTS_API_BASE_URL);
    private readonly authTokenProvider = inject(WORKOUTS_AUTH_TOKEN);

    private apiUrl(path: string): string {
        const base = (this.baseUrl || '').replace(/\/$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return base ? `${base}${p}` : p;
    }

    private authenticatedOptions(
        authToken: string | Promise<string | null> | null = this.authTokenProvider()
    ): Observable<{ headers: { Authorization: string } }> {
        const token = authToken;
        if (!token) {
            return throwError(() => new Error('No user signed in.'));
        }

        return from(Promise.resolve(token)).pipe(
            map((resolvedToken) => {
                if (!resolvedToken) {
                    throw new Error('No user signed in.');
                }
                return { headers: { Authorization: `Bearer ${resolvedToken}` } };
            })
        );
    }

    private optionalAuthenticatedOptions(
        authToken: string | Promise<string | null> | null = this.authTokenProvider()
    ): Observable<{ headers?: { Authorization: string } }> {
        if (!authToken) {
            return of({});
        }

        return from(Promise.resolve(authToken)).pipe(
            map((resolvedToken) => (resolvedToken ? { headers: { Authorization: `Bearer ${resolvedToken}` } } : {}))
        );
    }

    /** GET all workouts (optional search filters by name server-side). */
    getWorkouts(search?: string): Observable<TabataWorkout[]> {
        const trimmed = search?.trim();
        const params = trimmed ? new HttpParams().set('search', trimmed) : undefined;
        return this.optionalAuthenticatedOptions().pipe(
            switchMap((options) => this.http.get<TabataWorkout[]>(this.apiUrl('/api/workouts'), { ...options, params }))
        );
    }

    /** GET a single workout by id (if your proxy supports it). */
    getWorkoutById(id: string): Observable<TabataWorkout | null> {
        return this.optionalAuthenticatedOptions().pipe(
            switchMap((options) => this.http.get<TabataWorkout | null>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), options))
        );
    }

    /** DELETE workout. Accepts 200/204; does not require JSON body. */
    deleteWorkout(id: string, authToken?: string | Promise<string | null> | null): Observable<{ success: boolean }> {
        return this.authenticatedOptions(authToken ?? this.authTokenProvider()).pipe(
            switchMap((options) =>
                this.http
                    .delete(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), { ...options, responseType: 'text' })
                    .pipe(map(() => ({ success: true })))
            )
        );
    }

    /** POST a new workout (proxied to Upstash JSON.ARRAPPEND). */
    addWorkout(workout: TabataWorkout, authToken?: string | Promise<string | null> | null): Observable<{ success: boolean }> {
        return this.authenticatedOptions(authToken).pipe(
            switchMap((options) => this.http.post<{ success: boolean }>(this.apiUrl('/api/workouts'), workout, options))
        );
    }

    /** POST a new workout and return the saved workout (id, timestamps). */
    createWorkout(payload: CreateWorkoutPayload, authToken?: string | Promise<string | null> | null): Observable<TabataWorkout> {
        return this.authenticatedOptions(authToken).pipe(
            switchMap((options) => this.http.post<TabataWorkout>(this.apiUrl('/api/workouts'), payload, options))
        );
    }

    /** PUT an existing workout and return the updated workout. */
    updateWorkout(
        id: string,
        payload: UpdateWorkoutPayload,
        authToken?: string | Promise<string | null> | null
    ): Observable<TabataWorkout> {
        return this.authenticatedOptions(authToken).pipe(
            switchMap((options) => this.http.put<TabataWorkout>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), payload, options))
        );
    }
}
