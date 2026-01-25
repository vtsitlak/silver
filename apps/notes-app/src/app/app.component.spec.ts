import { TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { Location } from '@angular/common';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthFacade } from '@silver/notes-auth';

describe('AppComponent', () => {

  let location: Location;
  let router: Router;
  let fixture;
  let facade: AuthFacade;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        {
          provide: AuthFacade,
          useValue: {
            user: signal(null),
            isLoggedIn: signal(false),
            isLoggedOut: signal(true),
            login: jest.fn(),
            logout: jest.fn(),
            setUser: jest.fn()
          }
        }
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    facade = TestBed.inject(AuthFacade);
    fixture = TestBed.createComponent(AppComponent);
  }));

  it('should create the app', () => {
    fixture.detectChanges();
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Notes App'`, () => {
    fixture.detectChanges();
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Notes App');
  });

  it('navigate to "" redirects you to /login', fakeAsync(() => {
    router.initialNavigation();
    tick();
    router.navigate(['']);
    tick();
    expect(location.path()).toBe('/login');
  }));

  it('should call facade logout when logout is called', () => {
    fixture.detectChanges();
    const app = fixture.debugElement.componentInstance;
    app.logout();
    expect(facade.logout).toHaveBeenCalled();
  });
});
