/* eslint-disable @nx/enforce-module-boundaries */
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withComponentInputBinding } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './app/environments/environment';
import { inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthFacade } from '@silver/tabata/auth';
import { WORKOUTS_API_BASE_URL } from '@silver/tabata/workouts';
import { EXERCISES_API_BASE_URL } from '@silver/tabata/states/exercises';
import { rateLimitInterceptor } from './app/interceptors/rate-limit.interceptor';
import { of } from 'rxjs';

export function initAuthStore() {
    const authFacade = inject(AuthFacade);
    authFacade.getUser();
    return of(undefined);
}

export const appConfig = {
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
        provideHttpClient(withInterceptors([rateLimitInterceptor])),
        provideAppInitializer(initAuthStore),
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        { provide: WORKOUTS_API_BASE_URL, useValue: environment.production ? '' : (environment.workoutsApiBaseUrl ?? '') },
        { provide: EXERCISES_API_BASE_URL, useValue: '/api/exercises-db' }
    ]
};

bootstrapApplication(AppComponent, { ...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers] });
