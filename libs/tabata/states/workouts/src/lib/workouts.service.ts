import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { CreateWorkoutPayload, TabataWorkout, UpdateWorkoutPayload } from './workouts.models';
import { WORKOUTS_API_BASE_URL } from './workouts-api-base-url';

@Injectable({ providedIn: 'root' })
export class WorkoutsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(WORKOUTS_API_BASE_URL);

    private apiUrl(path: string): string {
        const base = (this.baseUrl || '').replace(/\/$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return base ? `${base}${p}` : p;
    }

    /** GET all workouts (optional search filters by name server-side). */
    getWorkouts(search?: string): Observable<TabataWorkout[]> {
        const trimmed = search?.trim();
        const params = trimmed ? new HttpParams().set('search', trimmed) : undefined;
        return this.http.get<TabataWorkout[]>(this.apiUrl('/api/workouts'), { params });
    }

    /** GET a single workout by id (if your proxy supports it). */
    getWorkoutById(id: string): Observable<TabataWorkout | null> {
        return this.http.get<TabataWorkout | null>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`));
    }

    /** DELETE workout. Accepts 200/204; does not require JSON body. */
    deleteWorkout(id: string): Observable<{ success: boolean }> {
        return this.http.delete(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), { responseType: 'text' }).pipe(map(() => ({ success: true })));
    }

    /** POST a new workout (proxied to Upstash JSON.ARRAPPEND). */
    addWorkout(workout: TabataWorkout): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(this.apiUrl('/api/workouts'), workout);
    }

    /** POST a new workout and return the saved workout (id, timestamps). */
    createWorkout(payload: CreateWorkoutPayload): Observable<TabataWorkout> {
        return this.http.post<TabataWorkout>(this.apiUrl('/api/workouts'), payload);
    }

    /** PUT an existing workout and return the updated workout. */
    updateWorkout(id: string, payload: UpdateWorkoutPayload): Observable<TabataWorkout> {
        return this.http.put<TabataWorkout>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), payload);
    }
}
