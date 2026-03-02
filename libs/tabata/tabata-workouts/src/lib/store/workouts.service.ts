import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { TabataWorkout } from './workouts.models';

/**
 * Calls the same-origin proxy /api/workouts (Vercel serverless or vercel dev).
 * The proxy holds UPSTASH_URL and UPSTASH_TOKEN; the frontend never sees the token.
 */
const API_PATH = '/api/workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutsService {
    private readonly http = inject(HttpClient);

    /** GET all workouts (proxied to Upstash). */
    getWorkouts(): Observable<TabataWorkout[]> {
        return this.http.get<TabataWorkout[]>(API_PATH);
    }

    /** GET a single workout by id (if your proxy supports it). */
    getWorkoutById(id: string): Observable<TabataWorkout | null> {
        return this.http.get<TabataWorkout | null>(`${API_PATH}/${encodeURIComponent(id)}`);
    }

    /** POST a new workout (proxied to Upstash JSON.ARRAPPEND). */
    addWorkout(workout: TabataWorkout): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(API_PATH, workout);
    }
}
