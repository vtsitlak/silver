import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type AuthEvent =
    | { kind: 'sendPasswordResetEmailSuccess'; message: string; navigateTo: string }
    | { kind: 'sendPasswordResetEmailError'; message: string }
    | { kind: 'signSuccess'; message: string; navigateTo: string }
    | { kind: 'signError'; message: string }
    | { kind: 'signWithGoogleSuccess'; message: string; navigateTo: string }
    | { kind: 'signWithGoogleError'; message: string }
    | { kind: 'registerSuccess'; message: string; navigateTo: string }
    | { kind: 'registerError'; message: string }
    | { kind: 'updateDisplayNameSuccess'; message: string }
    | { kind: 'updateDisplayNameError'; message: string }
    | { kind: 'updatePasswordSuccess'; message: string; navigateTo: string }
    | { kind: 'updatePasswordError'; message: string }
    | { kind: 'logoutSuccess'; message: string; navigateTo: string }
    | { kind: 'logoutError'; message: string };

@Injectable({ providedIn: 'root' })
export class AuthEventsService {
    private readonly events$ = new Subject<AuthEvent>();

    readonly events = this.events$.asObservable();

    emit(event: AuthEvent): void {
        this.events$.next(event);
    }
}
