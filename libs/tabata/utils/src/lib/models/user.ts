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
