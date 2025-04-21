import { Signal } from '@angular/core';

export interface ProfileUser {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
}

export interface LoginUser {
    email: string;
    password: string;
}

export interface NewUser {
    displayName: string;
    email: string;
    password: string;
}

export enum PROVIDER_ID {
    PASSWORD = 'password',
    GOOGLE = 'google.com'
}

export interface AuthState {
    user: ProfileUser | null;
    isLoading: boolean;
    usePassword: boolean;
    useGoogle: boolean;
    error: unknown;
}

export const authInitialState: AuthState = {
    user: null,
    isLoading: false,
    usePassword: false,
    useGoogle: false,
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
