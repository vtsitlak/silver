import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { TabataWorkout } from './workouts.models';
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

    /** GET all workouts (proxied to Upstash via Vercel or same-origin). */
    getWorkouts(): Observable<TabataWorkout[]> {
        return this.http.get<TabataWorkout[]>(this.apiUrl('/api/workouts'));
    }

    /** GET a single workout by id (if your proxy supports it). */
    getWorkoutById(id: string): Observable<TabataWorkout | null> {
        return this.http.get<TabataWorkout | null>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`));
    }

    /** DELETE workout. Accepts 200/204; does not require JSON body. */
    deleteWorkout(id: string): Observable<{ success: boolean }> {
        return this.http
            .delete(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), { responseType: 'text' })
            .pipe(map(() => ({ success: true })));
    }

    /** POST a new workout (proxied to Upstash JSON.ARRAPPEND). */
    addWorkout(workout: TabataWorkout): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(this.apiUrl('/api/workouts'), workout);
    }
}
