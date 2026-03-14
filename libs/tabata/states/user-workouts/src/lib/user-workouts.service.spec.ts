import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserWorkoutsService } from './user-workouts.service';
import { USER_WORKOUTS_API_BASE_URL } from './user-workouts-api-base-url';

describe('UserWorkoutsService', () => {
    let service: UserWorkoutsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: USER_WORKOUTS_API_BASE_URL, useValue: '' }]
        });
        service = TestBed.inject(UserWorkoutsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getUserWorkout should GET /api/user-workouts/:userId', () => {
        service.getUserWorkout('user1').subscribe((data) => {
            expect(data).toBeNull();
        });
        const req = httpMock.expectOne('/api/user-workouts/user1');
        expect(req.request.method).toBe('GET');
        req.flush(null);
    });

    it('saveUserWorkout should PUT /api/user-workouts/:userId', () => {
        const payload = {
            userId: 'user1',
            favoriteWorkouts: ['w1'],
            workoutItems: [{ workoutId: 'w1', completed: true, startedAt: '2025-01-01', finishedAt: '2025-01-01' }]
        };
        service.saveUserWorkout(payload).subscribe((data) => {
            expect(data.userId).toBe('user1');
        });
        const req = httpMock.expectOne('/api/user-workouts/user1');
        expect(req.request.method).toBe('PUT');
        req.flush(payload);
    });

    it('getOrCreateUserWorkout should return existing when GET returns data', () => {
        const existing = { userId: 'u1', favoriteWorkouts: [], workoutItems: [] };
        service.getOrCreateUserWorkout('u1').subscribe((data) => {
            expect(data).toEqual(existing);
        });
        const req = httpMock.expectOne('/api/user-workouts/u1');
        expect(req.request.method).toBe('GET');
        req.flush(existing);
    });

    it('getOrCreateUserWorkout should create and return when GET returns null', () => {
        const created = { userId: 'u2', favoriteWorkouts: [], workoutItems: [] };
        service.getOrCreateUserWorkout('u2').subscribe((data) => {
            expect(data.userId).toBe('u2');
            expect(data.favoriteWorkouts).toEqual([]);
            expect(data.workoutItems).toEqual([]);
        });
        const getReq = httpMock.expectOne('/api/user-workouts/u2');
        expect(getReq.request.method).toBe('GET');
        getReq.flush(null);
        const putReq = httpMock.expectOne('/api/user-workouts/u2');
        expect(putReq.request.method).toBe('PUT');
        putReq.flush(created);
    });
});
