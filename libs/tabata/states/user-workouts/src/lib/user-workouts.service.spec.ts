import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserWorkoutsService } from './user-workouts.service';
import { USER_WORKOUTS_API_BASE_URL } from './user-workouts-api-base-url';
import { USER_WORKOUTS_AUTH_TOKEN, type UserWorkoutsAuthTokenProvider } from './user-workouts-auth-token';

describe('UserWorkoutsService', () => {
    let service: UserWorkoutsService;
    let httpMock: HttpTestingController;
    let authTokenProvider: jest.MockedFunction<UserWorkoutsAuthTokenProvider>;

    beforeEach(() => {
        authTokenProvider = jest.fn().mockResolvedValue('firebase-token');

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: USER_WORKOUTS_AUTH_TOKEN, useValue: authTokenProvider },
                { provide: USER_WORKOUTS_API_BASE_URL, useValue: '' }
            ]
        });
        service = TestBed.inject(UserWorkoutsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getUserWorkout should GET /api/user-workouts/:userId with the Firebase bearer token', fakeAsync(() => {
        service.getUserWorkout('user1').subscribe((data) => {
            expect(data).toBeNull();
        });
        tick();
        const req = httpMock.expectOne('/api/user-workouts/user1');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush(null);
    }));

    it('saveUserWorkout should PUT /api/user-workouts/:userId with the Firebase bearer token', fakeAsync(() => {
        const payload = {
            userId: 'user1',
            favoriteWorkouts: ['w1'],
            workoutItems: [{ workoutId: 'w1', completed: true, startedAt: '2025-01-01', finishedAt: '2025-01-01' }]
        };
        service.saveUserWorkout(payload).subscribe((data) => {
            expect(data.userId).toBe('user1');
        });
        tick();
        const req = httpMock.expectOne('/api/user-workouts/user1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        req.flush(payload);
    }));

    it('getOrCreateUserWorkout should return existing when GET returns data', fakeAsync(() => {
        const existing = { userId: 'u1', favoriteWorkouts: [], workoutItems: [] };
        service.getOrCreateUserWorkout('u1').subscribe((data) => {
            expect(data).toEqual(existing);
        });
        tick();
        const req = httpMock.expectOne('/api/user-workouts/u1');
        expect(req.request.method).toBe('GET');
        req.flush(existing);
    }));

    it('getOrCreateUserWorkout should create and return when GET returns null', fakeAsync(() => {
        const created = { userId: 'u2', favoriteWorkouts: [], workoutItems: [] };
        service.getOrCreateUserWorkout('u2').subscribe((data) => {
            expect(data.userId).toBe('u2');
            expect(data.favoriteWorkouts).toEqual([]);
            expect(data.workoutItems).toEqual([]);
        });
        tick();
        const getReq = httpMock.expectOne('/api/user-workouts/u2');
        expect(getReq.request.method).toBe('GET');
        expect(getReq.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        getReq.flush(null);
        tick();
        const putReq = httpMock.expectOne('/api/user-workouts/u2');
        expect(putReq.request.method).toBe('PUT');
        expect(putReq.request.headers.get('Authorization')).toBe('Bearer firebase-token');
        putReq.flush(created);
    }));

    it('fails before sending a request when there is no signed-in Firebase user', fakeAsync(() => {
        // Arrange
        authTokenProvider.mockReturnValue(null);
        let error: unknown;

        // Act
        service.getUserWorkout('user1').subscribe({ error: (err: unknown) => (error = err) });
        tick();

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('No user signed in.');
        httpMock.expectNone('/api/user-workouts/user1');
    }));
});
