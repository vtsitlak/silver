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
                { provide: WORKOUTS_AUTH_TOKEN, useValue: authTokenProvider },
                { provide: WORKOUTS_API_BASE_URL, useValue: '' }
            ]
        });
        service = TestBed.inject(WorkoutsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should keep workout list reads public', () => {
        // Act
        service.getWorkouts().subscribe((data) => {
            expect(data).toEqual([]);
        });

        // Assert
        const req = httpMock.expectOne('/api/workouts');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush([]);
    });

    it('should POST created workouts with a Firebase bearer token', fakeAsync(() => {
        // Arrange
        const payload = workoutPayload();
        const saved = { ...payload, id: 'saved-id', createdAt: '2026-01-01', updatedAt: '2026-01-01' };

        // Act
        service.createWorkout(payload).subscribe((data) => {
            expect(data).toEqual(saved);
        });
        tick();

        // Assert
        const req = httpMock.expectOne('/api/workouts');
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush(saved);
    }));

    it('should DELETE workouts with a captured Firebase bearer token', fakeAsync(() => {
        // Arrange
        authTokenProvider.mockReturnValue(null);
        let result: { success: boolean } | undefined;

        // Act
        service.deleteWorkout('workout-1', 'captured-token').subscribe((data) => {
            result = data;
        });
        tick();

        // Assert
        const req = httpMock.expectOne('/api/workouts/workout-1');
        expect(req.request.method).toBe('DELETE');
        expect(req.request.headers.get('Authorization')).toBe('Bearer captured-token');
        req.flush(JSON.stringify({ success: true }));
        expect(result).toEqual({ success: true });
    }));

    it('should fail before mutating when there is no signed-in Firebase user', fakeAsync(() => {
        // Arrange
        authTokenProvider.mockReturnValue(null);
        let error: unknown;

        // Act
        service.updateWorkout('workout-1', { name: 'New name' }).subscribe({ error: (err: unknown) => (error = err) });
        tick();

        // Assert
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
