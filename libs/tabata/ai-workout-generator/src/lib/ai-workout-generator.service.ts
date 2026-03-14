import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { GenerateWorkoutInput, GenerateWorkoutOutput } from './types';

@Injectable({ providedIn: 'root' })
export class AiWorkoutGeneratorService {
    private readonly http = inject(HttpClient);

    /**
     * Calls the backend to generate warmup, blocks, and cooldown from workout info and exercise list.
     * Caller should merge the result into the draft and set generatedByAi to true.
     */
    generateWorkout(input: GenerateWorkoutInput): Observable<GenerateWorkoutOutput> {
        return this.http.post<GenerateWorkoutOutput>('/api/generate-workout', input);
    }
}
