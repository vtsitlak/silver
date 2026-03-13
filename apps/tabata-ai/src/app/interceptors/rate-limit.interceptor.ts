import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { timer, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        retry({
            count: 1,
            delay: (error: HttpErrorResponse, retryCount: number) => {
                if (error.status === 429) {
                    return throwError(() => error);
                }
                return throwError(() => error);
            }
        })
    );
};
