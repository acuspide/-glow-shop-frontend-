import { HttpErrorResponse } from '@angular/common/http';

/** Lo que significa cada código HTTP, dicho para una persona. */
const MENSAJES_POR_CODIGO: Record<number, string> = {
  0: 'No pudimos conectar con el servidor. Verifica que el backend esté encendido.',
  400: 'Revisa los datos.',
  401: 'Inicia sesión para continuar.',
  403: 'No tienes permiso para hacer esto.',
  404: 'Lo que buscas no existe.',
  409: 'Eso ya existe.',
  422: 'No se pudo completar la operación.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
};

const MENSAJE_GENERAL = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

/**
 * Convierte un error HTTP en un mensaje que una persona entienda:
 * primero lo que significa el código (400 "revisa los datos", 404 "no existe"...)
 * y después el detalle que manda el backend en { status, mensaje, timestamp }.
 * Ejemplo 422: "No se pudo completar la operación. La tienda no está activa."
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return MENSAJE_GENERAL;
  }

  const significado = MENSAJES_POR_CODIGO[error.status] ?? MENSAJE_GENERAL;
  const detalle = (error.error as { mensaje?: string } | null)?.mensaje;

  return detalle && error.status !== 0 ? `${significado} ${detalle}` : significado;
}
