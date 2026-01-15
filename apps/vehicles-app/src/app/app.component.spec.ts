import { TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { Location } from '@angular/common';
import { appRoutes } from './app-routing.module';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AppComponent', () => {

  let location: Location;
  let router: Router;
  let fixture;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(AppComponent);
  }));

  it('should create the app', () => {
    fixture.detectChanges();
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Vehicles application'`, () => {
    fixture.detectChanges();
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Vehicles application');
  });

  it('navigate to "" redirects you to /vehicles', fakeAsync(() => {
    router.initialNavigation();
    tick();
    router.navigate(['']);
    tick();
    expect(location.path()).toBe('/vehicles');
  }));
});
