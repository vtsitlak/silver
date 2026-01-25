import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart } from '@angular/router';
import { MatSidenavContainer, MatSidenav } from '@angular/material/sidenav';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthFacade } from '@silver/notes-auth';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        RouterOutlet,
        RouterLink,
        MatSidenavContainer,
        MatSidenav,
        MatNavList,
        MatListItem,
        MatIcon,
        MatToolbar,
        MatIconButton,
        MatProgressSpinner
    ]
})
export class AppComponent implements OnInit {

    title = 'Notes App';

    loading = true;

    authFacade = inject(AuthFacade);
    private router = inject(Router);

    ngOnInit() {

        const userProfile = localStorage.getItem('user');

        if (userProfile) {
            this.authFacade.setUser(JSON.parse(userProfile));
        }

        this.router.events.subscribe(event => {
            switch (true) {
                case event instanceof NavigationStart: {
                    this.loading = true;
                    break;
                }

                case event instanceof NavigationEnd:
                case event instanceof NavigationCancel:
                case event instanceof NavigationError: {
                    this.loading = false;
                    break;
                }
                default: {
                    break;
                }
            }
        });
    }

    logout() {
        this.authFacade.logout();
    }

}
