import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
    private readonly router = inject(Router);
    private navSubscription: Subscription | null = null;
    private darkObserver: MutationObserver | null = null;

    ngOnInit(): void {
        this.forceLightTheme();
        setTimeout(() => this.forceLightTheme(), 0);
        this.watchForDarkModeReapply();
        this.navSubscription = this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe(() => {
            const el = document.activeElement as HTMLElement | null;
            if (el?.blur) {
                el.blur();
            }
        });
    }

    private forceLightTheme(): void {
        const doc = document.documentElement;
        const body = document.body;
        doc.setAttribute('data-theme', 'light');
        doc.classList.add('force-light-theme');
        doc.classList.remove('dark');
        body.classList.add('force-light-theme');
        body.classList.remove('dark', 'ion-palette-dark');
    }

    /** When Android/DuckDuckGo injects dark classes after load, strip them and re-apply light. */
    private watchForDarkModeReapply(): void {
        if (typeof MutationObserver === 'undefined') return;
        this.darkObserver = new MutationObserver(() => {
            const doc = document.documentElement;
            const body = document.body;
            if (
                doc.classList.contains('dark') ||
                doc.classList.contains('ion-palette-dark') ||
                body.classList.contains('dark') ||
                body.classList.contains('ion-palette-dark')
            ) {
                this.forceLightTheme();
            }
        });
        this.darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        this.darkObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    ngOnDestroy(): void {
        this.darkObserver?.disconnect();
        this.darkObserver = null;
        this.navSubscription?.unsubscribe();
    }
}
