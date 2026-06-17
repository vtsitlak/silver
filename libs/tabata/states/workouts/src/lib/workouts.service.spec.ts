import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WORKOUTS_API_BASE_URL } from './workouts-api-base-url';
import { WORKOUTS_AUTH_TOKEN, type WorkoutsAuthTokenProvider } from './workouts-auth-token';
import { WorkoutsService } from './workouts.service';

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

    it('deleteWorkout should reuse a captured Firebase token when the live auth user is gone', fakeAsync(() => {
        // Arrange
        authTokenProvider.mockReturnValue(null);
        let result: { success: boolean } | undefined;

        // Act
        service.deleteWorkout('workout-1', 'captured-token').subscribe((data) => {
            result = data;
        });
        tick();

        const req = httpMock.expectOne('/api/workouts/workout-1');
        expect(req.request.method).toBe('DELETE');
        expect(req.request.headers.get('Authorization')).toBe('Bearer captured-token');
        req.flush('');
        tick();

        // Assert
        expect(result).toEqual({ success: true });
    }));
});
