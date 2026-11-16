import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../servicios/auth';

/**
 * Protege las rutas que necesitan sesión iniciada.
 * Si no hay sesión, envía al login y le dice a dónde volver después (?volverA=...).
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.haySesion()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { volverA: state.url } });
};
