import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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

    ngOnInit(): void {
        this.navSubscription = this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe(() => {
            const el = document.activeElement as HTMLElement | null;
            if (el?.blur) {
                el.blur();
            }
        });
    }

    ngOnDestroy(): void {
        this.navSubscription?.unsubscribe();
    }
}
