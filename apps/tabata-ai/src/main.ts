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
import { USER_WORKOUTS_API_BASE_URL } from '@silver/tabata/states/user-workouts';
import { GENERATE_WORKOUT_API_BASE_URL } from '@silver/tabata/ai-workout-generator';
import { rateLimitInterceptor } from './app/interceptors/rate-limit.interceptor';
import { of } from 'rxjs';
import { Capacitor } from '@capacitor/core';

const API_ORIGIN_VERCEL = 'https://silver-tabata-ai.vercel.app';

function isNativePlatform(): boolean {
    if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
        return true;
    }
    if (typeof document !== 'undefined' && document.URL) {
        const u = document.URL;
        if (
            u.startsWith('capacitor://') ||
            u.startsWith('http://localhost') ||
            u.startsWith('https://localhost') ||
            u.startsWith('file://') ||
            u === '' ||
            u === 'about:blank'
        ) {
            return true;
        }
        try {
            const loc = document.location;
            if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1' || loc.hostname === '') {
                return true;
            }
        } catch {
            return true;
        }
    }
    return false;
}

function getApiBaseUrl(): string {
    if (isNativePlatform()) {
        return API_ORIGIN_VERCEL;
    }
    return environment.production ? '' : (environment.workoutsApiBaseUrl ?? '');
}

export function initAuthStore() {
    const authFacade = inject(AuthFacade);
    authFacade.getUser();
    return of(undefined);
}

function forceLightTheme(): void {
    if (typeof document === 'undefined') return;
    const doc = document.documentElement;
    const body = document.body;
    doc.setAttribute('data-theme', 'light');
    doc.classList.add('force-light-theme');
    doc.classList.remove('dark');
    body.classList.add('force-light-theme');
    body.classList.remove('dark', 'ion-palette-dark');
}

export const appConfig = {
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
        provideHttpClient(withInterceptors([rateLimitInterceptor])),
        provideAppInitializer(() => {
            forceLightTheme();
            return of(undefined);
        }),
        provideAppInitializer(initAuthStore),
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        { provide: WORKOUTS_API_BASE_URL, useFactory: () => getApiBaseUrl() },
        {
            provide: EXERCISES_API_BASE_URL,
            useFactory: () => {
                const base = getApiBaseUrl();
                return base ? `${base.replace(/\/$/, '')}/api/exercises-db` : '/api/exercises-db';
            }
        },
        { provide: USER_WORKOUTS_API_BASE_URL, useFactory: () => getApiBaseUrl() },
        { provide: GENERATE_WORKOUT_API_BASE_URL, useFactory: () => getApiBaseUrl() }
    ]
};

bootstrapApplication(AppComponent, { ...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers] });
