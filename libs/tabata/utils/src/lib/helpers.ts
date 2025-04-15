import { User } from '@angular/fire/auth';
import { ProfileUser } from './models/user';

export function toProfileUser(user: User | null): ProfileUser | null {
    if (user) {
        const { uid, displayName, email, photoURL } = user;
        return { uid, displayName, email, photoURL } as ProfileUser;
    }
    return null;
}
