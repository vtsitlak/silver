import { CanActivateFn, Router } from '@angular/router';

import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.isLoggedIn();
  if (user) {
    return true;
  } else {
    router.navigate(['/auth']);
    return false;
  }
};
