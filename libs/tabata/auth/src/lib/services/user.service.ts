import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';

import { AuthService } from './auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileUser } from '../models/user';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private authService = inject(AuthService);
    private firestore = inject(Firestore);

    private currentUserProfile$ = this.authService.currentUser$.pipe(
        switchMap((user) => {
            if (!user?.uid) {
                return of(null);
            }

            const ref = doc(this.firestore, 'users', user?.uid);
            return docData(ref) as Observable<ProfileUser>;
        })
    );

    currentUserProfile = toSignal(this.currentUserProfile$);

    addUser(user: ProfileUser): Promise<void> {
        const ref = doc(this.firestore, 'users', user.uid);
        return setDoc(ref, user);
    }

    updateUser(user: ProfileUser): Promise<void> {
        const ref = doc(this.firestore, 'users', user.uid);
        return updateDoc(ref, { ...user });
    }
}
