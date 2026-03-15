import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { GenerateWorkoutInput, GenerateWorkoutOutput } from './types';
import { GENERATE_WORKOUT_API_BASE_URL } from './generate-workout-api-base-url';

@Injectable({ providedIn: 'root' })
export class AiWorkoutGeneratorService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(GENERATE_WORKOUT_API_BASE_URL);

    /**
     * Calls the backend to generate warmup, blocks, and cooldown from workout info and exercise list.
     * Caller should merge the result into the draft and set generatedByAi to true.
     */
    generateWorkout(input: GenerateWorkoutInput): Observable<GenerateWorkoutOutput> {
        const url = (this.baseUrl || '').replace(/\/$/, '') + '/api/generate-workout';
        return this.http.post<GenerateWorkoutOutput>(url, input);
    }
}
