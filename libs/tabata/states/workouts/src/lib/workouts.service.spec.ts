import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WORKOUTS_API_BASE_URL } from './workouts-api-base-url';
import { WORKOUTS_AUTH_TOKEN, type WorkoutsAuthTokenProvider } from './workouts-auth-token';
import { WorkoutsService } from './workouts.service';
import type { CreateWorkoutPayload } from './workouts.models';

describe('WorkoutsService', () => {
    let service: WorkoutsService;
    let httpMock: HttpTestingController;
    let authTokenProvider: jest.MockedFunction<WorkoutsAuthTokenProvider>;

    beforeEach(() => {
        authTokenProvider = jest.fn().mockResolvedValue('firebase-token');

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: WORKOUTS_API_BASE_URL, useValue: '' },
                { provide: WORKOUTS_AUTH_TOKEN, useValue: authTokenProvider }
            ]
        });
        service = TestBed.inject(WorkoutsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should keep workout list reads public when no user is signed in', () => {
        authTokenProvider.mockReturnValue(null);

        service.getWorkouts().subscribe((data) => {
            expect(data).toEqual([]);
        });

        const req = httpMock.expectOne('/api/workouts');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush([]);
    });

    it('should send a Firebase bearer token on workout list reads when signed in', fakeAsync(() => {
        service.getWorkouts(' strength ').subscribe((data) => {
            expect(data).toEqual([]);
        });
        tick();

        const req = httpMock.expectOne((request) => request.url === '/api/workouts' && request.params.get('search') === 'strength');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush([]);
    }));

    it('should send a Firebase bearer token on workout detail reads when signed in', fakeAsync(() => {
        const workout = { id: 'workout-1', name: 'Workout' };

        service.getWorkoutById('workout-1').subscribe((data) => {
            expect(data).toEqual(workout);
        });
        tick();

        const req = httpMock.expectOne('/api/workouts/workout-1');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush(workout);
    }));

    it('should POST created workouts with a Firebase bearer token', fakeAsync(() => {
        const payload = workoutPayload();
        const saved = { ...payload, id: 'saved-id', createdAt: '2026-01-01', updatedAt: '2026-01-01' };

        service.createWorkout(payload).subscribe((data) => {
            expect(data).toEqual(saved);
        });
        tick();

        const req = httpMock.expectOne('/api/workouts');
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush(saved);
    }));

    it('deleteWorkout should reuse a captured Firebase token when the live auth user is gone', fakeAsync(() => {
        authTokenProvider.mockReturnValue(null);
        let result: { success: boolean } | undefined;

        service.deleteWorkout('workout-1', 'captured-token').subscribe((data) => {
            result = data;
        });
        tick();

        const req = httpMock.expectOne('/api/workouts/workout-1');
        expect(req.request.method).toBe('DELETE');
        expect(req.request.headers.get('Authorization')).toBe('Bearer captured-token');
        req.flush('');
        tick();

        expect(result).toEqual({ success: true });
    }));

    it('should fail before mutating when there is no signed-in Firebase user', fakeAsync(() => {
        authTokenProvider.mockReturnValue(null);
        let error: unknown;

        service.updateWorkout('workout-1', { name: 'New name' }).subscribe({ error: (err: unknown) => (error = err) });
        tick();

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('No user signed in.');
        httpMock.expectNone('/api/workouts/workout-1');
    }));

    function workoutPayload(): CreateWorkoutPayload {
        return {
            name: 'Workout',
            description: '',
            totalDurationMinutes: 0,
            warmup: { totalDurationSeconds: 0, movements: [] },
            blocks: [],
            cooldown: { totalDurationSeconds: 0, movements: [] },
            updatedByUserId: 'client-user',
            createdByUserId: 'client-user',
            generatedByAi: false,
            mainTargetBodypart: 'Full Body',
            secondaryTargetBodyparts: [],
            availableEquipments: []
        };
    }
});
