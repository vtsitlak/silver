import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app-routing.module';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [provideZoneChangeDetection(), provideRouter(appRoutes), provideHttpClient(withXhr(), withInterceptorsFromDi()), provideAnimations()]
}).catch((err) => console.error(err));
