

import { Injectable, inject, effect } from '@angular/core';
import {  AuthStoreClass } from './auth.store'; // Adjust path accordingly
import { IAuthStore, LoginUser, NewUser } from '../models/user';

export const useAuthStore = (): IAuthStore => inject(AuthStoreClass as any);

@Injectable({ providedIn: 'root' })
export class AuthFacade {
 //  private authStore = inject(AuthStore);

  readonly user = useAuthStore().user;
  readonly isAuthenticated = useAuthStore().isAuthenticated;
  // readonly getUserLoading = useAuthStore().getUserLoading;
  // readonly getUserError = useAuthStore().getUserError;

  getUser() {
    useAuthStore().getUser();
  }

  login(credentials: LoginUser) {
    useAuthStore().login(credentials);
  }

  register(newUser: NewUser) {
    useAuthStore().register(newUser);
  }

  logout() {
    useAuthStore().logout();
  }

  // Optional: auto-load user on instantiation
  constructor() {
    effect(() => {
      this.getUser();
    });
  }
}
