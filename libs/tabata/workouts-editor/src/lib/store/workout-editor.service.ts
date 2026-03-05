import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WORKOUTS_API_BASE_URL, type TabataWorkout } from '@silver/tabata/tabata-workouts';
import type { CreateWorkoutPayload, UpdateWorkoutPayload } from './workout-editor.models';

@Injectable({ providedIn: 'root' })
export class WorkoutEditorService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(WORKOUTS_API_BASE_URL);

    private apiUrl(path: string): string {
        const base = (this.baseUrl || '').replace(/\/$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return base ? `${base}${p}` : p;
    }

    getWorkoutById(id: string): Observable<TabataWorkout> {
        return this.http.get<TabataWorkout>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`));
    }

    createWorkout(payload: CreateWorkoutPayload): Observable<TabataWorkout> {
        return this.http.post<TabataWorkout>(this.apiUrl('/api/workouts'), payload);
    }

    updateWorkout(id: string, payload: UpdateWorkoutPayload): Observable<TabataWorkout> {
        return this.http.put<TabataWorkout>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`), payload);
    }

    deleteWorkout(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(this.apiUrl(`/api/workouts/${encodeURIComponent(id)}`));
    }
}
