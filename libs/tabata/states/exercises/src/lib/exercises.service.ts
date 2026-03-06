import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Exercise, ExerciseListResponse, ExerciseSingleResponse, NameListResponse, SortBy, SortOrder } from './exercise.model';

const BASE_URL = 'https://www.exercisedb.dev/api/v1';
const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 25;

@Injectable({
    providedIn: 'root'
})
export class ExercisesService {
    private readonly http = inject(HttpClient);

    private params(offset = 0, limit = DEFAULT_LIMIT, extra: Record<string, string | number | boolean | undefined> = {}): HttpParams {
        let p = new HttpParams().set('offset', String(offset)).set('limit', String(Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit))));
        Object.entries(extra).forEach(([k, v]) => {
            if (v !== undefined && v !== '') p = p.set(k, String(v));
        });
        return p;
    }

    /** Get all exercises with optional search and sort (GET /api/v1/exercises) */
    getAllExercises(limit = DEFAULT_LIMIT, offset = 0, search = '', sortBy: SortBy = 'targetMuscles', sortOrder: SortOrder = 'desc'): Observable<Exercise[]> {
        const params = this.params(offset, limit, { search, sortBy, sortOrder });
        return this.http.get<ExerciseListResponse>(`${BASE_URL}/exercises`, { params }).pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Search exercises with fuzzy matching (GET /api/v1/exercises/search) */
    searchExercises(q: string, limit = DEFAULT_LIMIT, offset = 0, threshold = 0.3): Observable<Exercise[]> {
        const params = this.params(offset, limit, { q, threshold });
        return this.http.get<ExerciseListResponse>(`${BASE_URL}/exercises/search`, { params }).pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Filter exercises by muscles, equipment, bodyParts (GET /api/v1/exercises/filter) */
    filterExercises(options: {
        offset?: number;
        limit?: number;
        search?: string;
        muscles?: string;
        equipment?: string;
        bodyParts?: string;
        sortBy?: SortBy;
        sortOrder?: SortOrder;
    }): Observable<Exercise[]> {
        const { offset = 0, limit = DEFAULT_LIMIT, search, muscles, equipment, bodyParts, sortBy = 'name', sortOrder = 'desc' } = options;
        const params = this.params(offset, limit, { search, muscles, equipment, bodyParts, sortBy, sortOrder });
        return this.http.get<ExerciseListResponse>(`${BASE_URL}/exercises/filter`, { params }).pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Get single exercise by ID (GET /api/v1/exercises/{exerciseId}) */
    getExerciseById(exerciseId: string): Observable<Exercise | null> {
        return this.http
            .get<ExerciseSingleResponse>(`${BASE_URL}/exercises/${encodeURIComponent(exerciseId)}`)
            .pipe(map((res) => (res.success ? res.data : null)));
    }

    /** Get exercises by body part (GET /api/v1/bodyparts/{bodyPartName}/exercises) */
    getExercisesByBodyPart(bodyPartName: string, limit = DEFAULT_LIMIT, offset = 0): Observable<Exercise[]> {
        const params = this.params(offset, limit);
        return this.http
            .get<ExerciseListResponse>(`${BASE_URL}/bodyparts/${encodeURIComponent(bodyPartName)}/exercises`, { params })
            .pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Get exercises by equipment (GET /api/v1/equipments/{equipmentName}/exercises) */
    getExercisesByEquipment(equipmentName: string, limit = DEFAULT_LIMIT, offset = 0): Observable<Exercise[]> {
        const params = this.params(offset, limit);
        return this.http
            .get<ExerciseListResponse>(`${BASE_URL}/equipments/${encodeURIComponent(equipmentName)}/exercises`, { params })
            .pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Get exercises by target muscle (GET /api/v1/muscles/{muscleName}/exercises) */
    getExercisesByMuscle(muscleName: string, limit = DEFAULT_LIMIT, offset = 0, includeSecondary = false): Observable<Exercise[]> {
        let params = this.params(offset, limit);
        if (includeSecondary) params = params.set('includeSecondary', 'true');
        return this.http
            .get<ExerciseListResponse>(`${BASE_URL}/muscles/${encodeURIComponent(muscleName)}/exercises`, { params })
            .pipe(map((res) => (res.success ? res.data : [])));
    }

    /** Get all muscles (GET /api/v1/muscles) */
    getMusclesList(): Observable<string[]> {
        return this.http.get<NameListResponse>(`${BASE_URL}/muscles`).pipe(map((res) => (res.success ? res.data.map((x) => x.name) : [])));
    }

    /** Get all equipments (GET /api/v1/equipments) */
    getEquipmentList(): Observable<string[]> {
        return this.http.get<NameListResponse>(`${BASE_URL}/equipments`).pipe(map((res) => (res.success ? res.data.map((x) => x.name) : [])));
    }

    /** Get all body parts (GET /api/v1/bodyparts) */
    getBodyPartList(): Observable<string[]> {
        return this.http.get<NameListResponse>(`${BASE_URL}/bodyparts`).pipe(map((res) => (res.success ? res.data.map((x) => x.name) : [])));
    }
}
