import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../servicios/auth';
import { NotificacionesService } from '../servicios/notificaciones';

/**
 * Se escribe una sola vez y actúa sobre todas las peticiones:
 * 1. Si hay sesión, agrega el encabezado Authorization: Bearer <token>.
 * 2. Si el backend responde 401 teniendo sesión (token vencido o alterado),
 *    cierra la sesión, avisa y manda al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const avisos = inject(NotificacionesService);
  const token = auth.token();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLoginOLogout = req.url.endsWith('/auth/login') || req.url.endsWith('/auth/logout');
      // auth.haySesion() evita repetir el aviso si fallan varias peticiones a la vez.
      if (error.status === 401 && token && !esLoginOLogout && auth.haySesion()) {
        auth.sesionExpirada();
        avisos.error('Tu sesión venció. Inicia sesión de nuevo.');
      }
      return throwError(() => error);
    }),
  );
};
