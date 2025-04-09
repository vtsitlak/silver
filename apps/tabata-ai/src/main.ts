/* eslint-disable @nx/enforce-module-boundaries */
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withViewTransitions,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './app/environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig); // Initialize Firebase here

export const appConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes,       withViewTransitions(),
    withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => firebaseApp),
    provideFirestore(() => getFirestore()),
     provideAuth(() => getAuth())
  ]
};

bootstrapApplication(AppComponent, appConfig);

