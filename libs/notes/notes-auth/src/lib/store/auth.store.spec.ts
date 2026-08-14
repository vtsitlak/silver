import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
    let store: InstanceType<typeof AuthStore>;
    let httpTestingController: HttpTestingController;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr(), withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideRouter([{ path: 'notes', children: [] }])
            ]
        });
        store = TestBed.inject(AuthStore);
        httpTestingController = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
        jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        localStorage.removeItem('user');
    });

    afterEach(() => {
        httpTestingController.verify();
        localStorage.removeItem('user');
    });

    it('should keep accepting logins after a failed attempt (no rxMethod soft-lock)', fakeAsync(() => {
        store.login({ email: 'user1@email.com', password: 'wrong' });

        const failed = httpTestingController.expectOne('/api/login');
        failed.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
        tick();

        expect(store.user()).toBeNull();

        store.login({ email: 'user1@email.com', password: 'test' });

        const ok = httpTestingController.expectOne('/api/login');
        expect(ok.request.method).toBe('POST');
        ok.flush({ id: 1, name: 'user1', email: 'user1@email.com' });
        tick();

        expect(store.user()?.email).toBe('user1@email.com');
        expect(router.navigateByUrl).toHaveBeenCalledWith('/notes');
    }));
});
