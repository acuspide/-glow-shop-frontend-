import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error HTTP en un mensaje amigable.
 * El backend responde errores como { timestamp, status, mensaje }.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Verifica que el backend esté encendido.';
    }
    const mensaje = (error.error as { mensaje?: string } | null)?.mensaje;
    if (mensaje) {
      return mensaje;
    }
    if (error.status === 401) {
      return 'Debes iniciar sesión para continuar.';
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}