import { Injectable, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { User } from '../models/user.model';

/**
 * Facade for AuthStore that provides a clean API layer
 * for components to interact with the authentication state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private readonly store = inject(AuthStore);

  // State signals
  readonly user = this.store.user;
  readonly isLoggedIn = this.store.isLoggedIn;
  readonly isLoggedOut = this.store.isLoggedOut;

  // Methods
  login(email: string, password: string): void {
    this.store.login({ email, password });
  }

  logout(): void {
    this.store.logout();
  }

  setUser(user: User): void {
    this.store.setUser(user);
  }
}
