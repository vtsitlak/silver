import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { mockAuth } from '@silver/tabata/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Auth, useValue: mockAuth }]
        });
        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
