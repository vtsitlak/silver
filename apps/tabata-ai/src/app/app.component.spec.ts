import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
    it('should create the app', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('should force light theme on init', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        expect(document.documentElement.classList.contains('force-light-theme')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.body.classList.contains('force-light-theme')).toBe(true);
        expect(document.body.classList.contains('dark')).toBe(false);
        expect(document.body.classList.contains('ion-palette-dark')).toBe(false);
    });
});
