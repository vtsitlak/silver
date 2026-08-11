import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Filter } from '../models/filter';
import { Vehicle } from '../models/vehicle';
import { SnackBarService } from '@silver/shared/helpers';

@Injectable({
    providedIn: 'root'
})
export class VehiclesService {
    private http = inject(HttpClient);
    private snackBarService = inject(SnackBarService);

    getAll(): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(`/api/vehicles`, { observe: 'body', responseType: 'json' }).pipe(catchError((error) => this.handleError(error)));
    }

    getByFilter(filter: Filter): Observable<Vehicle[]> {
        return this.http
            .post<Vehicle[]>(`/api/vehicles`, filter, { observe: 'body', responseType: 'json' })
            .pipe(catchError((error) => this.handleError(error)));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
            this.snackBarService.show(error.error.message);
        } else {
            this.snackBarService.show('An error occurred while loading vehicles.');
        }
        // return an observable with a user-facing error message
        const message =
            error.error instanceof ErrorEvent
                ? error.error.message
                : typeof error.error?.message === 'string'
                  ? error.error.message
                  : error.message || 'Failed to load vehicles';
        return throwError(() => new Error(message));
    }
}
