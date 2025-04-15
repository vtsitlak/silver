import { Signal } from '@angular/core';
export interface ProfileUser {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
}

export interface AuthState {
    user: ProfileUser | null;
    // isAuthenticated: boolean;
    isLoading: boolean;
    error: unknown;
}

export const authInitialState: AuthState = {
    user: null,
    // isAuthenticated: false,
    isLoading: false,
    error: null
};

export interface LoginUser {
    email: string;
    password: string;
}

export interface NewUser {
    displayName: string;
    email: string;
    password: string;
}

export interface IAuthStore {
    user: Signal<ProfileUser | null>;
    isAuthenticated: Signal<boolean>;
    getUser(): void;
    login(credentials: LoginUser): void;
    register(user: NewUser): void;
    logout(): void;
}
