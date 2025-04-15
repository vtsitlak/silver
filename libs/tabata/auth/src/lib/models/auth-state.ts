import { Signal } from '@angular/core';
import { LoginUser, NewUser, ProfileUser } from '@silver/tabata/helpers';

export interface AuthState {
    user: ProfileUser | null;
    isLoading: boolean;
    error: unknown;
}

export const authInitialState: AuthState = {
    user: null,
    isLoading: false,
    error: null
};

export interface IAuthStore {
    user: Signal<ProfileUser | null>;
    isAuthenticated: Signal<boolean>;
    getUser(): void;
    login(credentials: LoginUser): void;
    register(user: NewUser): void;
    logout(): void;
}
