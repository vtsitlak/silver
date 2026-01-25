import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable, inject } from '@angular/core';
import { AuthFacade } from './store/auth.facade';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authFacade = inject(AuthFacade);
    private router = inject(Router);

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean {

        const isLoggedIn = this.authFacade.isLoggedIn();
        
        if (!isLoggedIn) {
            this.router.navigateByUrl('/login');
            return false;
        }

        return true;
    }
}
