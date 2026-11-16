import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RolUsuario } from '../modelos/modelos';
import { AuthService } from '../servicios/auth';

/**
 * Deja entrar solo a un rol. Se usa después de authGuard, que ya revisó que haya sesión:
 *   canActivate: [authGuard, rolGuard('VENDEDOR')]
 * Si el rol no coincide, envía al inicio (el backend igual respondería 403).
 */
export function rolGuard(rol: RolUsuario): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.usuario()?.rol === rol ? true : router.createUrlTree(['/']);
  };
}
