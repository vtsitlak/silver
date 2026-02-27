import { User } from '@angular/fire/auth';

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

export interface UpdatePasswordDetails {
    email: string;
    currentPassword: string;
    newPassword: string;
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

export enum AuthErrors {
    Sign = 'sign',
    GetUser = 'getUser',
    SendPasswordResetEmail = 'sendPasswordResetEmail',
    SignWithGoogle = 'signWithGoogle',
    Register = 'register',
    UpdateDisplayName = 'updateDisplayName',
    UpdatePassword = 'updatePassword',
    Logout = 'logout'
}

export const authInitialState: AuthState = {
    user: null,
    isLoading: false,
    usePassword: false,
    useGoogle: false,
    error: null
};

export function toProfileUser(user: User | null): ProfileUser | null {
    if (user) {
        const { uid, displayName, email, photoURL } = user;
        return { uid, displayName, email, photoURL } as ProfileUser;
    }
    return null;
}

export function userToState(user: User | null, isLoading = false): AuthState | null {
    if (user) {
        return {
            user: toProfileUser(user),
            isLoading,
            usePassword: user.providerData.map((data) => data.providerId).indexOf(PROVIDER_ID.PASSWORD) > -1,
            useGoogle: user.providerData.map((data) => data.providerId).indexOf(PROVIDER_ID.GOOGLE) > -1,
            error: null
        };
    }
    return null;
}
