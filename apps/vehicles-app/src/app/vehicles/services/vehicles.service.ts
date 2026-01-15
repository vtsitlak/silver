import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Vehicle } from '../models/vehicle';
import { Filter } from '../models/filter';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VehiclesService {
  private http = inject(HttpClient);

  getAll(): Observable<Vehicle[]> {
    return this.http
      .get<Vehicle[]>(`/api/vehicles`, { observe: 'body', responseType: 'json' })
      .pipe(catchError(this.handleError));
  }

  getByFilter(filter: Filter): Observable<Vehicle[]> {
    return this.http
      .post<Vehicle[]>(`/api/vehicles`, filter, { observe: 'body', responseType: 'json' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    }
    // return an observable with a user-facing error message
    return throwError(() => new Error(error.error.message));
  }
}
